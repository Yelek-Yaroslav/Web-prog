class Product {
    constructor(name, category, price, amount, image) {
        this.name = name;
        this.category = category;
        this.price = Number(price) || 0;
        this.amount = amount;
        this.image = image;
    }

    addToBasket() {
        console.log(`Product with name ${this.name} has been added to the basket`);
    }
}

class Writing extends Product {
    constructor(name, price, amount, image) {
        super(name, 'writing', price, amount, image);
    }
}

class Paper extends Product {
    constructor(name, price, amount, image) {
        super(name, 'paper', price, amount, image);
    }
}

function productFactory(item) {
    if (item.category === 'writing') {
        return new Writing(item.name, item.price, item.amount, item.image);
    }
    if (item.category === 'paper') {
        return new Paper(item.name, item.price, item.amount, item.image);
    }
    throw new Error(`Невідома категорія товару: ${item.category}`);
}

class Basket {
    constructor(onRemoveCallback) {
        this.products = [];
        this.onRemoveCallback = onRemoveCallback;
    }

    add(product) {
        const addedTime = new Date().toLocaleTimeString('uk-UA');
        const basketItem = {
            name: product.name,
            category: product.category,
            price: product.price,
            image: product.image,
            addedTime
        };

        this.products.push(basketItem);
        product.addToBasket();
        this.render();
    }

    remove(index) {
        const [removed] = this.products.splice(index, 1);
        if (removed && this.onRemoveCallback) {
            this.onRemoveCallback(removed.name);
        }
        this.render();
    }

    getTotalPrice() {
        return this.products.reduce((sum, item) => sum + item.price, 0);
    }

    render() {
        const basketList = document.getElementById('basket-list');
        const basketCount = document.getElementById('basket-count');
        const basketTotal = document.getElementById('basket-total');

        basketCount.textContent = this.products.length;
        basketTotal.textContent = `${this.getTotalPrice()} грн`;
        basketList.innerHTML = '';

        if (this.products.length === 0) {
            basketList.innerHTML = '<p class="empty-msg">Кошик порожній</p>';
            return;
        }

        this.products.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'basket-item';
            el.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="basket-info">
                    <strong>${item.name}</strong>
                    <div class="basket-meta">
                        <span class="basket-price">${item.price} грн</span>
                        <small>о ${item.addedTime}</small>
                    </div>
                </div>
                <button class="remove-btn" title="Видалити з кошика">×</button>
            `;

            el.querySelector('.remove-btn').addEventListener('click', () => this.remove(index));
            basketList.appendChild(el);
        });
    }
}

class Store {
    constructor() {
        this.products = [];
        this.activeCategory = 'all';
        this.basket = new Basket((productName) => this.returnProductToStore(productName));
    }

    fillStoreWithProducts(data) {
        this.products = data.map((item) => productFactory(item));
        this.renderProducts();
    }

    setCategory(category) {
        this.activeCategory = category;
        this.renderProducts();
    }

    addProductToBasket(productName) {
        const product = this.products.find((p) => p.name === productName);
        if (!product || product.amount <= 0) {
            return;
        }

        product.amount -= 1;
        this.basket.add(product);
        this.renderProducts();
    }

    returnProductToStore(productName) {
        const product = this.products.find((p) => p.name === productName);
        if (product) {
            product.amount += 1;
            this.renderProducts();
        }
    }

    renderProducts() {
        const grid = document.getElementById('products-grid');
        grid.innerHTML = '';

        const filtered = this.activeCategory === 'all'
            ? this.products
            : this.products.filter((p) => p.category === this.activeCategory);

        filtered.forEach((product) => {
            const card = document.createElement('article');
            card.className = 'product-card';

            const isOutOfStock = product.amount === 0;
            const categoryLabel = product.category === 'writing' ? 'Письмове' : 'Папір';

            card.innerHTML = `
                <div class="img-wrap">
                    <img src="${product.image}" alt="${product.name}">
                    <span class="badge badge-${product.category}">${categoryLabel}</span>
                </div>
                <div class="card-body">
                    <h3>${product.name}</h3>
                    <div class="price-row">
                        <span class="price">${product.price} грн</span>
                        <span class="stock">В наявності: <strong>${product.amount}</strong> шт.</span>
                    </div>
                    <button class="add-btn" ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 'Немає в наявності' : 'Додати в кошик'}
                    </button>
                </div>
            `;

            card.querySelector('.add-btn').addEventListener('click', () => {
                this.addProductToBasket(product.name);
            });

            grid.appendChild(card);
        });
    }
}

const store = new Store();

document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        store.setCategory(btn.dataset.category);
    });
});

fetch('products.json')
    .then((response) => {
        if (!response.ok) throw new Error('Помилка завантаження products.json');
        return response.json();
    })
    .then((data) => {
        store.fillStoreWithProducts(data);
        store.basket.render();
    })
    .catch((error) => {
        console.error(error);
        document.getElementById('products-grid').innerHTML =
            '<p class="error-msg">Не вдалося завантажити товари. Запустіть сторінку через Live Server.</p>';
    });