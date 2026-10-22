
import { useState } from 'react';
import { CartContext } from './useCart';



export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (pizza) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === pizza.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === pizza.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { ...pizza, quantity: 1 }];
    });
  };

  const removeFromCart = (pizzaId) => {
    setCartItems(prevItems =>
      prevItems.filter(item => item.id !== pizzaId)
    );
  };

  const increaseQuantity = (pizzaId) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === pizzaId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQuantity = (pizzaId) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === pizzaId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  const getTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      getTotal,
      getCartCount,
      clearCart: () => setCartItems([])
    }}>
      {children}
    </CartContext.Provider>
  );
};
