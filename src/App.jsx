import { useEffect, useMemo, useState } from 'react'
import {
  firebaseConfigError,
  getFirebaseAuth,
  getFirebaseFirestore,
} from './firebase'
import './App.css'

const PRODUCTS = [
  {
    id: 1,
    name: 'Everyday Tote',
    description: 'A roomy canvas tote made for wherever the day takes you.',
    price: 28,
    category: 'everyday-living',
    imageAlt: 'Beige canvas tote bag',
    image:
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    name: 'Ceramic Coffee Mug',
    description: 'A handmade-feel stoneware mug for slow mornings.',
    price: 18,
    category: 'kitchen',
    imageAlt: 'Handmade ceramic coffee mug',
    image:
      'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    name: 'Linen Table Runner',
    description: 'Soft, natural linen to bring a little warmth to the table.',
    price: 36,
    category: 'everyday-living',
    imageAlt: 'Natural beige linen table runner',
    image:
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 4,
    name: 'Amber Glass Bottle',
    description: 'A reusable glass bottle with a simple, timeless shape.',
    price: 22,
    category: 'kitchen',
    imageAlt: 'Amber glass water bottle',
    image:
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
  },
]

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount)

function debounce(callback, delay) {
  let timeoutId

  function debounced(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => callback(...args), delay)
  }

  debounced.cancel = () => clearTimeout(timeoutId)

  return debounced
}

function ProductCard({ product, onAddToCart }) {
  return (
    <article className="product-card">
      <img
        className="product-image"
        src={product.image}
        alt={product.imageAlt}
        loading="lazy"
      />
      <div className="product-details">
        <h2>{product.name}</h2>
        <p className="product-description">{product.description}</p>
        <p className="product-price">{formatCurrency(product.price)}</p>
        <button
          className="add-to-cart-button"
          type="button"
          onClick={() => onAddToCart(product)}
        >
          Add to Cart
        </button>
      </div>
    </article>
  )
}

function Cart({ cartItems, onClose, onProceedToCheckout }) {
  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  )

  return (
    <div className="cart-overlay">
      <button
        className="cart-backdrop"
        type="button"
        aria-label="Close shopping cart"
        onClick={onClose}
      />
      <aside
        id="shopping-cart"
        className="cart-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        <div className="cart-panel-header">
          <div>
            <p className="eyebrow">Your selection</p>
            <h2 id="cart-title">Shopping cart</h2>
          </div>
          <button
            className="cart-close-button"
            type="button"
            aria-label="Close shopping cart"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {cartItems.length === 0 ? (
          <p className="cart-empty">Your cart is waiting for something lovely.</p>
        ) : (
          <ul className="cart-items">
            {cartItems.map((item) => (
              <li className="cart-item" key={item.id}>
                <img className="cart-item-image" src={item.image} alt="" />
                <div className="cart-item-details">
                  <h3>{item.name}</h3>
                  <p>
                    {formatCurrency(item.price)} &times; {item.quantity}
                  </p>
                </div>
                <p className="cart-item-subtotal">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="cart-total">
          <span>Total</span>
          <strong>{formatCurrency(cartTotal)}</strong>
        </div>
        {cartItems.length > 0 && (
          <button
            className="checkout-button"
            type="button"
            onClick={onProceedToCheckout}
          >
            Proceed to Checkout
          </button>
        )}
      </aside>
    </div>
  )
}

function CheckoutForm({
  error,
  firebaseError,
  isSubmitting,
  onCancel,
  onSubmit,
  total,
  userEmail,
}) {
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    email: userEmail ?? '',
  })
  const [validationError, setValidationError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((currentData) => ({ ...currentData, [name]: value }))
    setValidationError('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    const normalizedFormData = {
      fullName: formData.fullName.trim(),
      address: formData.address.trim(),
      email: formData.email.trim(),
    }

    if (!normalizedFormData.fullName || !normalizedFormData.address) {
      setValidationError('Enter your full name and delivery address.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedFormData.email)) {
      setValidationError('Enter a valid email address.')
      return
    }

    setValidationError('')
    onSubmit(normalizedFormData)
  }

  return (
    <div className="checkout-overlay">
      <button
        className="cart-backdrop"
        type="button"
        aria-label="Close checkout"
        onClick={onCancel}
      />
      <section
        className="checkout-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
      >
        <div className="cart-panel-header">
          <div>
            <p className="eyebrow">Almost yours</p>
            <h2 id="checkout-title">Checkout</h2>
          </div>
          <button
            className="cart-close-button"
            type="button"
            aria-label="Close checkout"
            onClick={onCancel}
          >
            &times;
          </button>
        </div>

        <form className="checkout-form" noValidate onSubmit={handleSubmit}>
          <label htmlFor="fullName">Full name</label>
          <input
            autoComplete="name"
            id="fullName"
            name="fullName"
            onChange={handleChange}
            required
            value={formData.fullName}
          />

          <label htmlFor="address">Address</label>
          <textarea
            autoComplete="street-address"
            id="address"
            name="address"
            onChange={handleChange}
            required
            rows={3}
            value={formData.address}
          />

          <label htmlFor="email">Email</label>
          <input
            autoComplete="email"
            id="email"
            name="email"
            onChange={handleChange}
            required
            type="email"
            value={formData.email}
          />

          <p className="checkout-total">
            <span>Order total</span>
            <strong>{formatCurrency(total)}</strong>
          </p>

          {validationError && (
            <p className="checkout-message checkout-error" role="alert">
              {validationError}
            </p>
          )}
          {firebaseError && (
            <p className="checkout-message checkout-error" role="alert">
              Orders are unavailable: {firebaseError}
            </p>
          )}
          {error && (
            <p className="checkout-message checkout-error" role="alert">
              {error}
            </p>
          )}

          <div className="checkout-actions">
            <button
              className="checkout-cancel-button"
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Back to cart
            </button>
            <button
              className="checkout-button"
              type="submit"
              disabled={isSubmitting || Boolean(firebaseError)}
            >
              {isSubmitting ? 'Placing order...' : 'Place Order'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function LoginForm({ firebaseError, onAuthenticate, onCancel }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSignUp = mode === 'signup'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await onAuthenticate(mode, email, password)
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : 'Unable to authenticate. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="checkout-overlay">
      <button
        className="cart-backdrop"
        type="button"
        aria-label="Close sign in"
        onClick={onCancel}
      />
      <section
        className="checkout-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
      >
        <div className="cart-panel-header">
          <div>
            <p className="eyebrow">Good to have you here</p>
            <h2 id="login-title">{isSignUp ? 'Create account' : 'Sign in'}</h2>
          </div>
          <button
            className="cart-close-button"
            type="button"
            aria-label="Close sign in"
            onClick={onCancel}
          >
            &times;
          </button>
        </div>

        <form className="checkout-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email</label>
          <input
            autoComplete="email"
            id="login-email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />

          <label htmlFor="login-password">Password</label>
          <input
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            id="login-password"
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />

          {firebaseError && (
            <p className="checkout-message checkout-error" role="alert">
              {firebaseError}
            </p>
          )}
          {error && (
            <p className="checkout-message checkout-error" role="alert">
              {error}
            </p>
          )}

          <div className="checkout-actions">
            <button
              className="checkout-cancel-button"
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="checkout-button"
              type="submit"
              disabled={isSubmitting || Boolean(firebaseError)}
            >
              {isSubmitting
                ? 'Please wait...'
                : isSignUp
                  ? 'Create Account'
                  : 'Sign In'}
            </button>
          </div>
        </form>

        <p className="auth-switch">
          {isSignUp ? 'Already have an account?' : 'New here?'}{' '}
          <button
            className="auth-switch-button"
            type="button"
            onClick={() => {
              setMode(isSignUp ? 'signin' : 'signup')
              setError('')
            }}
          >
            {isSignUp ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </section>
    </div>
  )
}

function Recommendations({ products, onAddToCart }) {
  return (
    <section
      className="recommendations-section"
      aria-labelledby="recommendations-title"
    >
      <div className="recommendations-heading">
        <p className="eyebrow">Picked to go together</p>
        <h2 id="recommendations-title">You might also like</h2>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </section>
  )
}

function App() {
  const [cartItems, setCartItems] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckout, setIsCheckout] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [checkoutAfterLogin, setCheckoutAfterLogin] = useState(false)
  const [recommendedProducts, setRecommendedProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredProducts, setFilteredProducts] = useState(PRODUCTS)
  const [firebaseAuth, setFirebaseAuth] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(!firebaseConfigError)
  const [firebaseError, setFirebaseError] = useState(firebaseConfigError)
  const [orderError, setOrderError] = useState('')
  const [orderSuccess, setOrderSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const grandTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  )
  const auth = firebaseAuth?.auth ?? null
  const debouncedFilterProducts = useMemo(
    () =>
      debounce((term) => {
        const normalizedTerm = term.trim().toLowerCase()

        setFilteredProducts(
          PRODUCTS.filter(
            (product) =>
              product.name.toLowerCase().includes(normalizedTerm) ||
              product.description.toLowerCase().includes(normalizedTerm),
          ),
        )
      }, 300),
    [],
  )

  // Debounce catalog filtering while typing and cancel pending work on changes or unmount.
  useEffect(() => {
    debouncedFilterProducts(searchTerm)
    return () => debouncedFilterProducts.cancel()
  }, [debouncedFilterProducts, searchTerm])

  // Load authentication after the initial render so Firebase does not block the catalog.
  useEffect(() => {
    if (firebaseConfigError) return undefined

    let isActive = true
    let idleCallbackId
    let timeoutId

    function loadFirebaseAuth() {
      getFirebaseAuth()
        .then((services) => {
          if (isActive) setFirebaseAuth(services)
        })
        .catch((error) => {
          console.error('Firebase Authentication initialization failed:', error)
          if (isActive) {
            setFirebaseError(
              error instanceof Error
                ? error.message
                : 'Unable to initialize Firebase Authentication.',
            )
            setAuthLoading(false)
          }
        })
    }

    if ('requestIdleCallback' in window) {
      idleCallbackId = window.requestIdleCallback(loadFirebaseAuth, {
        timeout: 2000,
      })
    } else {
      timeoutId = window.setTimeout(loadFirebaseAuth, 0)
    }

    return () => {
      isActive = false
      if (idleCallbackId !== undefined) {
        window.cancelIdleCallback(idleCallbackId)
      }
      window.clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    if (!auth || !firebaseAuth) return undefined

    // Keep the header and checkout synchronized with Firebase's persisted auth session.
    return firebaseAuth.authSdk.onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user)
        setAuthLoading(false)
      },
      (error) => {
        console.error('Unable to observe Firebase authentication state:', error)
        setFirebaseError(error.message)
        setAuthLoading(false)
      },
    )
  }, [auth, firebaseAuth])

  // Remove the order confirmation after giving the customer time to read it.
  useEffect(() => {
    if (!orderSuccess) return undefined

    const timeoutId = setTimeout(() => setOrderSuccess(''), 5000)
    return () => clearTimeout(timeoutId)
  }, [orderSuccess])

  function generateRecommendations(category) {
    setRecommendedProducts(
      PRODUCTS.filter((product) => product.category === category),
    )
  }

  function handleAddToCart(product) {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id)

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }

      return [...currentItems, { ...product, quantity: 1 }]
    })
    generateRecommendations(product.category)
    setOrderSuccess('')
  }

  async function handleAuthenticate(mode, email, password) {
    if (!auth || !firebaseAuth) {
      throw new Error(firebaseError || 'Firebase Authentication is unavailable.')
    }

    const authenticate =
      mode === 'signup'
        ? firebaseAuth.authSdk.createUserWithEmailAndPassword
        : firebaseAuth.authSdk.signInWithEmailAndPassword
    const credential = await authenticate(auth, email, password)

    setCurrentUser(credential.user)
    setIsLoginOpen(false)
    setOrderError('')

    if (checkoutAfterLogin) {
      setIsCheckout(true)
      setCheckoutAfterLogin(false)
    }
  }

  function handleProceedToCheckout() {
    setIsCartOpen(false)
    setOrderError('')

    if (currentUser) {
      setIsCheckout(true)
      return
    }

    setCheckoutAfterLogin(true)
    setIsLoginOpen(true)
  }

  async function handleSignOut() {
    if (!auth || !firebaseAuth) return

    try {
      await firebaseAuth.authSdk.signOut(auth)
      setCurrentUser(null)
    } catch (error) {
      console.error('Unable to sign out:', error)
      setOrderError('Unable to sign out. Please try again.')
    }
  }

  async function handlePlaceOrder(formData) {
    if (!currentUser) {
      setOrderError(
        firebaseError || 'Please sign in before placing your order.',
      )
      return
    }

    setIsSubmitting(true)
    setOrderError('')

    try {
      const { db, firestoreSdk } = await getFirebaseFirestore()
      const newOrder = {
        userId: currentUser.uid,
        items: cartItems.map(({ id, name, price, quantity }) => ({
          id,
          name,
          price,
          quantity,
        })),
        total: grandTotal,
        address: formData.address,
        fullName: formData.fullName,
        email: formData.email,
        createdAt: firestoreSdk.serverTimestamp(),
      }

      // Keep the cart intact unless Firestore confirms the order was saved.
      const orderRef = await firestoreSdk.addDoc(
        firestoreSdk.collection(db, 'orders'),
        newOrder,
      )
      console.info('Order successfully placed:', orderRef.id)
      setCartItems([])
      setIsCheckout(false)
      setIsCartOpen(false)
      setOrderSuccess('Your order has been placed. Thank you!')
    } catch (error) {
      console.error('Unable to save the order to Firestore:', error)
      setOrderError(
        error instanceof Error
          ? `Unable to save your order: ${error.message}`
          : 'Unable to save your order. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="storefront">
      {orderSuccess && (
        <div className="order-toast" role="status">
          {orderSuccess}
        </div>
      )}
      <header className="site-header">
        <a className="brand" href="/" aria-label="Good Things home">
          good things<span>.</span>
        </a>
        <label className="header-search">
          <span className="visually-hidden">Search products</span>
          <input
            type="search"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
        <div className="header-actions">
          {currentUser ? (
            <button
              className="auth-header-button"
              type="button"
              onClick={handleSignOut}
            >
              Sign out
            </button>
          ) : (
            <button
              className="auth-header-button"
              type="button"
              disabled={authLoading || Boolean(firebaseError)}
              onClick={() => {
                setCheckoutAfterLogin(false)
                setIsLoginOpen(true)
              }}
            >
              Sign in
            </button>
          )}
          <button
            className="cart-indicator"
            type="button"
            aria-label={`Shopping cart, ${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'}`}
            aria-expanded={isCartOpen}
            aria-controls="shopping-cart"
            onClick={() => setIsCartOpen((isOpen) => !isOpen)}
          >
            <svg
              aria-hidden="true"
              className="cart-icon"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
              <circle cx="10" cy="20" r="1.3" fill="currentColor" />
              <circle cx="18" cy="20" r="1.3" fill="currentColor" />
            </svg>
            <span className="cart-count" aria-hidden="true">
              {cartItems.length}
            </span>
          </button>
        </div>
      </header>

      <main>
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">Thoughtful finds for everyday living</p>
          <h1 id="page-title">A little more lovely.</h1>
              <p className="intro-copy">
                Useful, well-made things that make home feel like yours.
              </p>
        </section>

        <section className="product-section" aria-label="Featured products">
          {filteredProducts.length > 0 ? (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <p className="no-products-message" role="status">
              No products found. Try a different search.
            </p>
          )}
        </section>

        {recommendedProducts.length > 0 && (
          <Recommendations
            products={recommendedProducts}
            onAddToCart={handleAddToCart}
          />
        )}
      </main>
      {isCartOpen && (
        <Cart
          cartItems={cartItems}
          onClose={() => setIsCartOpen(false)}
          onProceedToCheckout={handleProceedToCheckout}
        />
      )}
      {isCheckout && (
        <CheckoutForm
          error={orderError}
          firebaseError={firebaseError}
          isSubmitting={isSubmitting}
          onCancel={() => {
            setIsCheckout(false)
            setIsCartOpen(true)
          }}
          onSubmit={handlePlaceOrder}
          total={grandTotal}
          userEmail={currentUser?.email}
        />
      )}
      {isLoginOpen && (
        <LoginForm
          firebaseError={firebaseError}
          onAuthenticate={handleAuthenticate}
          onCancel={() => {
            setIsLoginOpen(false)
            setCheckoutAfterLogin(false)
          }}
        />
      )}
    </div>
  )
}

export default App
