import { Link } from 'react-router-dom';
import { useCart } from '../context/useCart';
import { formatPrice } from '../utils/formatPrice';

const CardPizza = ({ pizza }) => {
  const { addToCart } = useCart();

  const cardStyles = {
    card: {
      border: 'none',
      borderRadius: '15px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      transition: 'transform 0.3s ease',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    },
    cardHover: {
      transform: 'translateY(-5px)'
    },
    image: {
      height: '200px',
      objectFit: 'cover',
      borderTopLeftRadius: '15px',
      borderTopRightRadius: '15px'
    },
    ingredientsList: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    ingredientItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '4px'
    },
    price: {
      color: '#28a745',
      fontSize: '1.25rem',
      fontWeight: 'bold',
      textAlign: 'center',
      width: '100%',
      padding: '10px 0'
    },
    button: {
      backgroundColor: '#28a745',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      color: 'white',
      fontWeight: '500',
      transition: 'background-color 0.3s ease',
      marginTop: 'auto'
    },
    buttonHover: {
      backgroundColor: '#218838'
    }
  };

  return (
    <div 
      className="card h-100" 
      style={cardStyles.card}
      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <img 
        src={pizza.img} 
        className="card-img-top" 
        alt={pizza.name}
        style={cardStyles.image}
      />
      <div className="card-body d-flex flex-column">
        <h5 className="card-title fw-bold mb-3">{pizza.name}</h5>
        <p className="card-text mb-2">Ingredientes:</p>
        <ul style={cardStyles.ingredientsList}>
          {pizza.ingredients.map((ingredient, index) => (
            <li key={index} style={cardStyles.ingredientItem}>
              <span>🍕</span> {ingredient}
            </li>
          ))}
        </ul>
        <div className="mt-auto">
          <p className="card-text" style={cardStyles.price}>
            ${formatPrice(pizza.price)}
          </p>
          <Link className="btn btn-outline-dark w-100 mb-2" to={`/pizza/${pizza.id}`}>Ver más 👀</Link>
          <button 
            className="btn w-100"
            style={cardStyles.button}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
            onClick={() => addToCart(pizza)}
          >
            Añadir al Carrito 🛒
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardPizza;
