const API = (() => {
  const URL = "http://localhost:3000";
  const getCart = () => {
    // define your method to get cart data
    return fetch(`${URL}/cart`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }).then((res) => res.json());
  };

  const getInventory = () => {
    // define your method to get inventory data
    return fetch(`${URL}/inventory`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }).then((res) => res.json());
  };

  const addToCart = (cartItem) => {
    // define your method to add an item to cart
    return fetch(`${URL}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(cartItem),
    }).then((res) => res.json());
  };

  const updateCart = (id, item) => {
    // define your method to update an item in cart
    return fetch(`${URL}/cart/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(item),
    }).then((res) => res.json());
  };

  const deleteFromCart = (id) => {
    // define your method to delete an item in cart
    return fetch(`${URL}/cart/${id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    }).then((res) => res.json());
  };

  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };

  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChangeInventory;
    #onChangeCart;
    #inventory;
    #cart;
    constructor() {
      this.#inventory = []; // list of {content: item, count: val}
      this.#cart = []; // list of {content: item, cont: val}
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChangeCart(newCart);
    }

    set inventory(newInventory) {
      this.#inventory = newInventory;
      this.#onChangeInventory(newInventory);
    }

    subscribeInventory(cb) {
      this.#onChangeInventory = cb;
    }
    subscribeCart(cb) {
      this.#onChangeCart = cb;
    }
  }
  const {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  } = API;
  return {
    State,
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const View = (() => {
  // implement your logic for View
  const createBtn = () => document.createElement("button");

  const renderInventoryItems = (items) => {
    // items is list of {content: item, count: val}
    const inventoryList = document.querySelector(".inventory__item-list");
    inventoryList.innerHTML = "";

    items.forEach((data) => {
      const item = data.content;
      const count = data.count;

      const listItem = document.createElement("li");

      const spanItem = document.createElement("span");
      spanItem.innerText = item;

      const removeBtn = createBtn();
      removeBtn.innerText = "-";
      removeBtn.id = `remove-${item}`;
      removeBtn.className = `btn btn__red`;

      const spanCounter = document.createElement("span");
      spanCounter.innerText = `${count}`;
      spanCounter.id = `counter-${item}`;

      const addBtn = createBtn();
      addBtn.innerText = "+";
      addBtn.id = `add-${item}`;
      addBtn.className = `btn btn__green`;

      const addToCartBtn = createBtn();
      addToCartBtn.innerText = "add to cart";
      addToCartBtn.id = `save-${item}`;
      addToCartBtn.className = `btn btn__blue`;

      listItem.appendChild(spanItem);
      listItem.appendChild(removeBtn);
      listItem.appendChild(spanCounter);
      listItem.appendChild(addBtn);
      listItem.appendChild(addToCartBtn);

      // add to list
      inventoryList.appendChild(listItem);
    });
  };

  const renderCartItems = (items) => {
    const cartList = document.querySelector(".cart__item-list");
    cartList.innerHTML = "";

    items.forEach((item) => {
      const listItem = document.createElement("li");

      const span = document.createElement("span");
      span.innerText = `${item.content} x ${item.count}`;
      const deleteBtn = document.createElement("button");
      deleteBtn.innerText = "delete";
      deleteBtn.id = `delete-${item.content}`;
      deleteBtn.className = `btn btn__blue`;

      listItem.appendChild(span);
      listItem.appendChild(deleteBtn);

      cartList.appendChild(listItem);
    });
  };

  return {
    renderInventoryItems,
    renderCartItems,
  };
})();

const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();
  const inventoryContainer = document.querySelector(".inventory-container");
  const cartContainer = document.querySelector(".cart__item-list");

  const init = () => {
    // set up subscriber functions
    state.subscribeInventory(view.renderInventoryItems);
    state.subscribeCart(view.renderCartItems);

    // fetch inventory data
    model.getInventory().then((data) => {
      // save inventory data
      const tmp = [];
      data.forEach((item) => {
        tmp.push({
          ...item,
          count: 0,
        });
      });
      state.inventory = tmp;
    });

    // fetch cart data
    model.getCart().then((data) => {
      // save cart data
      state.cart = data;
    });
  };

  const handleInventoryEvents = () => {
    // setup event listener for clicks on inventory actions
    inventoryContainer.addEventListener("click", (e) => {
      e.preventDefault();
      const element = e.target;
      if (element.nodeName !== "BUTTON") {
        return;
      }
      const tmp = element.id.split("-");
      const action = tmp[0];
      const itemName = tmp[1];

      // find item in state's inventory list and
      // get current item count and index
      let count;
      let inventoryIndex;
      for (let i = 0; i < state.inventory.length; i++) {
        if (state.inventory[i].content === itemName) {
          count = state.inventory[i].count;
          inventoryIndex = i;
          break;
        }
      }

      if (count === undefined) {
        alert("Item could not be found in inventory.");
        return;
      }

      // run action with count
      if (action === "save") {
        if (count === 0) {
          return; // don't do anything if count already 0, no negatives.
        }
        // save to cart
        handleAddToCart(inventoryIndex);
      } else if (action === "remove") {
        if (count === 0) {
          return; // don't do anything if count already 0, no negatives.
        }
        count--;
        state.inventory[inventoryIndex].count = count;
        state.inventory = state.inventory; // trigger callback
      } else if (action === "add") {
        count++;
        state.inventory[inventoryIndex].count = count;
        state.inventory = state.inventory; // trigger callback
      } else {
        alert("Unknown action.");
      }
    });
  };

  const handleAddToCart = (inventoryIndex) => {
    //  just update cart in state, callback will automatically sync with db.
    const itemName = state.inventory[inventoryIndex].content;
    const cartIndex = state.cart.findIndex((item) => item.content === itemName);

    if (cartIndex === -1) {
      // not in cart yet
      // add inventory count to cart count for this item
      const itemPtr = state.inventory[inventoryIndex];
      // const newItem = Object.create(itemPtr); // shallow copy
      const newItem = {
        ...itemPtr,
      };
      state.cart.push(newItem);
      state.cart = state.cart; // trigger callback (view)

      // add to DB
      model.addToCart(newItem);
    } else {
      // update item in cart
      const countToAdd = state.inventory[inventoryIndex].count;
      const itemPtr = state.cart[cartIndex];
      itemPtr.count += countToAdd;
      state.cart = state.cart; // trigger callback (view)

      // update item in DB
      model.updateCart(itemPtr.id, itemPtr);
    }
  };

  const handleCartEvents = () => {
    // setup event listener on cart wrapper
    document.querySelector(".cart-wrapper").addEventListener("click", (e) => {
      const element = e.target;

      if (element.nodeName !== "BUTTON") {
        return;
      }

      const tmp = element.id.split("-");
      if (tmp.length === 1) {
        // checkout button
        // clear cart and sync with db
        state.cart = [];
        model.checkout();
        return;
      }

      // delete button
      // delete just the item from db
      const itemName = tmp[1];

      // find id (in hindsight, should have used id in the id attribute.)
      const cartItemIndex = state.cart.findIndex(
        (item) => item.content === itemName
      );
      const cartItemId = state.cart[cartItemIndex].id;
      // update state (and view)
      state.cart.splice(cartItemIndex, 1);
      state.cart = state.cart; // trigger view callback

      // update db
      model.deleteFromCart(cartItemId);
    });
  };

  const bootstrap = () => {
    init();
    handleInventoryEvents();
    handleCartEvents();
  };
  return {
    bootstrap,
  };
})(Model, View);

Controller.bootstrap();
