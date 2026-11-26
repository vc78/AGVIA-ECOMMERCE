import React, { Suspense, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import ProtectedRoute from './ProtectedRoute'
import { trackPageView } from '../services/analytics'
import PageTransition from '../components/customer/PageTransition'
import BoutiqueSpinner from '../components/customer/BoutiqueSpinner'
import { lazyRetry } from '../utils/lazyRetry'

function ProductRedirect() {
  const { id } = useParams()
  return <Navigate to={`/products/${id}`} replace />
}

function CollectionRedirect() {
  const { category } = useParams()
  return <Navigate to={`/products?category=${encodeURIComponent(category || '')}`} replace />
}

// Lazy loaded customer pages with deployment chunk-retry
const Home = lazyRetry(() => import('../pages/customer/Home'))
const Products = lazyRetry(() => import('../pages/customer/Products'))
const ProductDetails = lazyRetry(() => import('../pages/customer/ProductDetails'))
const Cart = lazyRetry(() => import('../pages/customer/Cart'))
const Checkout = lazyRetry(() => import('../pages/customer/Checkout'))
const Orders = lazyRetry(() => import('../pages/customer/Orders'))
const Profile = lazyRetry(() => import('../pages/customer/Profile'))
const Categories = lazyRetry(() => import('../pages/customer/Categories'))
const Offers = lazyRetry(() => import('../pages/customer/Offers'))
const GiftBoxes = lazyRetry(() => import('../pages/customer/GiftBoxes'))
const WeddingOrders = lazyRetry(() => import('../pages/customer/WeddingOrders'))
const CorporateOrders = lazyRetry(() => import('../pages/customer/CorporateOrders'))
const About = lazyRetry(() => import('../pages/customer/About'))
const Contact = lazyRetry(() => import('../pages/customer/Contact'))
const Faq = lazyRetry(() => import('../pages/customer/Faq'))
const PrivacyPolicy = lazyRetry(() => import('../pages/customer/PrivacyPolicy'))
const RefundPolicy = lazyRetry(() => import('../pages/customer/RefundPolicy'))
const Terms = lazyRetry(() => import('../pages/customer/Terms'))
const ForgotPassword = lazyRetry(() => import('../pages/customer/ForgotPassword'))
const ResetPassword = lazyRetry(() => import('../pages/customer/ResetPassword'))
const Wishlist = lazyRetry(() => import('../pages/customer/Wishlist'))
const PaymentSuccess = lazyRetry(() => import('../pages/customer/PaymentSuccess'))
const PaymentFailed = lazyRetry(() => import('../pages/customer/PaymentFailed'))
const TrackOrder = lazyRetry(() => import('../pages/customer/TrackOrder'))
const Addresses = lazyRetry(() => import('../pages/customer/Addresses'))
const Notifications = lazyRetry(() => import('../pages/customer/Notifications'))
const Subscription = lazyRetry(() => import('../pages/customer/Subscription'))
const SizeGuide = lazyRetry(() => import('../pages/customer/SizeGuide'))
const ShippingPolicy = lazyRetry(() => import('../pages/customer/ShippingPolicy'))
const CancellationPolicy = lazyRetry(() => import('../pages/customer/CancellationPolicy'))
const CookiePolicy = lazyRetry(() => import('../pages/customer/CookiePolicy'))
const ReturnExchangePolicy = lazyRetry(() => import('../pages/customer/ReturnExchangePolicy'))
const IntellectualProperty = lazyRetry(() => import('../pages/customer/IntellectualProperty'))
const Disclaimer = lazyRetry(() => import('../pages/customer/Disclaimer'))
const Craftsmanship = lazyRetry(() => import('../pages/customer/Craftsmanship'))
const Sustainability = lazyRetry(() => import('../pages/customer/Sustainability'))
const ProductCare = lazyRetry(() => import('../pages/customer/ProductCare'))
const Blogs = lazyRetry(() => import('../pages/customer/Blogs'))
const StoreLocations = lazyRetry(() => import('../pages/customer/StoreLocations'))
const Careers = lazyRetry(() => import('../pages/customer/Careers'))
const BulkOrders = lazyRetry(() => import('../pages/customer/BulkOrders'))
const Styling = lazyRetry(() => import('../pages/customer/Styling'))
const Appointments = lazyRetry(() => import('../pages/customer/Appointments'))
const NotFound = lazyRetry(() => import('../pages/customer/NotFound'))

// Lazy loaded auth pages
const Login = lazyRetry(() => import('../pages/auth/Login'))
const Register = lazyRetry(() => import('../pages/auth/Register'))

// Lazy loaded admin pages
const AdminLogin = lazyRetry(() => import('../pages/admin/AdminLogin'))
const Dashboard = lazyRetry(() => import('../pages/admin/Dashboard'))
const StoreBilling = lazyRetry(() => import('../pages/admin/StoreBilling'))
const ProductsManagement = lazyRetry(() => import('../pages/admin/ProductsManagement'))
const AddProduct = lazyRetry(() => import('../pages/admin/AddProduct'))
const EditProduct = lazyRetry(() => import('../pages/admin/EditProduct'))
const CategoriesManagement = lazyRetry(() => import('../pages/admin/CategoriesManagement'))
const OrdersManagement = lazyRetry(() => import('../pages/admin/OrdersManagement'))
const ReturnsManagement = lazyRetry(() => import('../pages/admin/ReturnsManagement'))
const Customers = lazyRetry(() => import('../pages/admin/Customers'))
const Inventory = lazyRetry(() => import('../pages/admin/Inventory'))
const OffersManagement = lazyRetry(() => import('../pages/admin/Offers'))
const CouponsManagement = lazyRetry(() => import('../pages/admin/CouponsManagement'))
const Reviews = lazyRetry(() => import('../pages/admin/Reviews'))
const Analytics = lazyRetry(() => import('../pages/admin/Analytics'))
const SubscriptionsManagement = lazyRetry(() => import('../pages/admin/SubscriptionsManagement'))
const Settings = lazyRetry(() => import('../pages/admin/Settings'))

export default function AppRoutes() {
  const location = useLocation()

  useEffect(() => {
    // Only track public/customer routes to avoid polluting customer analytics with internal admin workspace views
    if (!location.pathname.startsWith('/admin')) {
      trackPageView(location.pathname, document.title)
    }
  }, [location.pathname])

  return (
    <Suspense fallback={<BoutiqueSpinner />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public / customer-facing */}
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/products" element={<PageTransition><Products /></PageTransition>} />
          <Route path="/shop" element={<Navigate to="/products" replace />} />
          <Route path="/collections" element={<Navigate to="/products" replace />} />
          <Route path="/collections/:category" element={<CollectionRedirect />} />
          <Route path="/products/:id" element={<PageTransition><ProductDetails /></PageTransition>} />
          <Route path="/product/:id" element={<ProductRedirect />} />
          <Route path="/categories" element={<PageTransition><Categories /></PageTransition>} />
          <Route path="/offers" element={<PageTransition><Offers /></PageTransition>} />
          <Route path="/gift-boxes" element={<PageTransition><GiftBoxes /></PageTransition>} />
          <Route path="/wedding-orders" element={<PageTransition><WeddingOrders /></PageTransition>} />
          <Route path="/corporate-orders" element={<PageTransition><CorporateOrders /></PageTransition>} />
          <Route path="/about" element={<PageTransition><About /></PageTransition>} />
          <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
          <Route path="/faq" element={<PageTransition><Faq /></PageTransition>} />
          <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
          <Route path="/refund-policy" element={<PageTransition><RefundPolicy /></PageTransition>} />
          <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
          <Route path="/size-guide" element={<PageTransition><SizeGuide /></PageTransition>} />
          <Route path="/shipping-policy" element={<PageTransition><ShippingPolicy /></PageTransition>} />
          <Route path="/cancellation-policy" element={<PageTransition><CancellationPolicy /></PageTransition>} />
          <Route path="/cookie-policy" element={<PageTransition><CookiePolicy /></PageTransition>} />
          <Route path="/return-exchange-policy" element={<PageTransition><ReturnExchangePolicy /></PageTransition>} />
          <Route path="/intellectual-property" element={<PageTransition><IntellectualProperty /></PageTransition>} />
          <Route path="/disclaimer" element={<PageTransition><Disclaimer /></PageTransition>} />
          <Route path="/craftsmanship" element={<PageTransition><Craftsmanship /></PageTransition>} />
          <Route path="/sustainability" element={<PageTransition><Sustainability /></PageTransition>} />
          <Route path="/product-care" element={<PageTransition><ProductCare /></PageTransition>} />
          <Route path="/blogs" element={<PageTransition><Blogs /></PageTransition>} />
          <Route path="/store-locations" element={<PageTransition><StoreLocations /></PageTransition>} />
          <Route path="/careers" element={<PageTransition><Careers /></PageTransition>} />
          <Route path="/bulk-orders" element={<PageTransition><BulkOrders /></PageTransition>} />
          <Route path="/styling" element={<PageTransition><Styling /></PageTransition>} />
          <Route path="/appointments" element={<PageTransition><Appointments /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
          <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
          <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
          <Route path="/wishlist" element={<PageTransition><Wishlist /></PageTransition>} />
          <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
          <Route path="/payment-success" element={<PageTransition><PaymentSuccess /></PageTransition>} />
          <Route path="/payment-failed" element={<PageTransition><PaymentFailed /></PageTransition>} />
          <Route path="/track-order" element={<PageTransition><TrackOrder /></PageTransition>} />
          <Route path="/track" element={<Navigate to="/track-order" replace />} />
          <Route path="/subscription" element={<PageTransition><Subscription /></PageTransition>} />

          {/* Customer — requires login */}
          <Route path="/checkout" element={<ProtectedRoute role="CUSTOMER"><PageTransition><Checkout /></PageTransition></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute role="CUSTOMER"><PageTransition><Orders /></PageTransition></ProtectedRoute>} />
          <Route path="/my-orders" element={<Navigate to="/orders" replace />} />
          <Route path="/profile" element={<ProtectedRoute role="CUSTOMER"><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute role="CUSTOMER"><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
          <Route path="/addresses" element={<ProtectedRoute role="CUSTOMER"><PageTransition><Addresses /></PageTransition></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute role="CUSTOMER"><PageTransition><Notifications /></PageTransition></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/login" element={<PageTransition><AdminLogin /></PageTransition>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute role="ADMIN"><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/pos" element={<ProtectedRoute role="ADMIN"><PageTransition><StoreBilling /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/billing" element={<Navigate to="/admin/pos" replace />} />
          <Route path="/admin/products" element={<ProtectedRoute role="ADMIN"><PageTransition><ProductsManagement /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/products/add" element={<ProtectedRoute role="ADMIN"><PageTransition><AddProduct /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/products/edit/:id" element={<ProtectedRoute role="ADMIN"><PageTransition><EditProduct /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute role="ADMIN"><PageTransition><CategoriesManagement /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute role="ADMIN"><PageTransition><OrdersManagement /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/returns" element={<ProtectedRoute role="ADMIN"><PageTransition><ReturnsManagement /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/customers" element={<ProtectedRoute role="ADMIN"><PageTransition><Customers /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/subscriptions" element={<ProtectedRoute role="ADMIN"><PageTransition><SubscriptionsManagement /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/inventory" element={<ProtectedRoute role="ADMIN"><PageTransition><Inventory /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/offers" element={<ProtectedRoute role="ADMIN"><PageTransition><OffersManagement /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/coupons" element={<ProtectedRoute role="ADMIN"><PageTransition><CouponsManagement /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute role="ADMIN"><PageTransition><Reviews /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute role="ADMIN"><PageTransition><Analytics /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute role="ADMIN"><PageTransition><Settings /></PageTransition></ProtectedRoute>} />

          {/* Fallback / 404 */}
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}
