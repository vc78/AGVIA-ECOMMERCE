import React, { lazy, Suspense } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import ProtectedRoute from './ProtectedRoute'
import PageTransition from '../components/customer/PageTransition'
import BoutiqueSpinner from '../components/customer/BoutiqueSpinner'

// Lazy loaded customer pages
const Home = lazy(() => import('../pages/customer/Home'))
const Products = lazy(() => import('../pages/customer/Products'))
const ProductDetails = lazy(() => import('../pages/customer/ProductDetails'))
const Cart = lazy(() => import('../pages/customer/Cart'))
const Checkout = lazy(() => import('../pages/customer/Checkout'))
const Orders = lazy(() => import('../pages/customer/Orders'))
const Profile = lazy(() => import('../pages/customer/Profile'))
const Categories = lazy(() => import('../pages/customer/Categories'))
const Offers = lazy(() => import('../pages/customer/Offers'))
const GiftBoxes = lazy(() => import('../pages/customer/GiftBoxes'))
const WeddingOrders = lazy(() => import('../pages/customer/WeddingOrders'))
const CorporateOrders = lazy(() => import('../pages/customer/CorporateOrders'))
const About = lazy(() => import('../pages/customer/About'))
const Contact = lazy(() => import('../pages/customer/Contact'))
const Faq = lazy(() => import('../pages/customer/Faq'))
const PrivacyPolicy = lazy(() => import('../pages/customer/PrivacyPolicy'))
const RefundPolicy = lazy(() => import('../pages/customer/RefundPolicy'))
const Terms = lazy(() => import('../pages/customer/Terms'))
const ForgotPassword = lazy(() => import('../pages/customer/ForgotPassword'))
const ResetPassword = lazy(() => import('../pages/customer/ResetPassword'))
const Wishlist = lazy(() => import('../pages/customer/Wishlist'))
const PaymentSuccess = lazy(() => import('../pages/customer/PaymentSuccess'))
const PaymentFailed = lazy(() => import('../pages/customer/PaymentFailed'))
const TrackOrder = lazy(() => import('../pages/customer/TrackOrder'))
const Addresses = lazy(() => import('../pages/customer/Addresses'))
const Notifications = lazy(() => import('../pages/customer/Notifications'))
const Subscription = lazy(() => import('../pages/customer/Subscription'))
const SizeGuide = lazy(() => import('../pages/customer/SizeGuide'))
const ShippingPolicy = lazy(() => import('../pages/customer/ShippingPolicy'))
const CancellationPolicy = lazy(() => import('../pages/customer/CancellationPolicy'))
const CookiePolicy = lazy(() => import('../pages/customer/CookiePolicy'))
const ReturnExchangePolicy = lazy(() => import('../pages/customer/ReturnExchangePolicy'))
const IntellectualProperty = lazy(() => import('../pages/customer/IntellectualProperty'))
const Disclaimer = lazy(() => import('../pages/customer/Disclaimer'))
const Craftsmanship = lazy(() => import('../pages/customer/Craftsmanship'))
const Sustainability = lazy(() => import('../pages/customer/Sustainability'))
const ProductCare = lazy(() => import('../pages/customer/ProductCare'))
const Blogs = lazy(() => import('../pages/customer/Blogs'))
const StoreLocations = lazy(() => import('../pages/customer/StoreLocations'))
const Careers = lazy(() => import('../pages/customer/Careers'))
const BulkOrders = lazy(() => import('../pages/customer/BulkOrders'))
const Styling = lazy(() => import('../pages/customer/Styling'))
const Appointments = lazy(() => import('../pages/customer/Appointments'))

// Lazy loaded auth pages
const Login = lazy(() => import('../pages/auth/Login'))
const Register = lazy(() => import('../pages/auth/Register'))
const VerifyOtp = lazy(() => import('../pages/auth/VerifyOtp'))
const VerifyLoginOtp = lazy(() => import('../pages/auth/VerifyLoginOtp'))

// Lazy loaded admin pages
const AdminLogin = lazy(() => import('../pages/admin/AdminLogin'))
const Dashboard = lazy(() => import('../pages/admin/Dashboard'))
const ProductsManagement = lazy(() => import('../pages/admin/ProductsManagement'))
const AddProduct = lazy(() => import('../pages/admin/AddProduct'))
const EditProduct = lazy(() => import('../pages/admin/EditProduct'))
const CategoriesManagement = lazy(() => import('../pages/admin/CategoriesManagement'))
const OrdersManagement = lazy(() => import('../pages/admin/OrdersManagement'))
const Customers = lazy(() => import('../pages/admin/Customers'))
const Inventory = lazy(() => import('../pages/admin/Inventory'))
const OffersManagement = lazy(() => import('../pages/admin/Offers'))
const CouponsManagement = lazy(() => import('../pages/admin/CouponsManagement'))
const Reviews = lazy(() => import('../pages/admin/Reviews'))
const Analytics = lazy(() => import('../pages/admin/Analytics'))
const SubscriptionsManagement = lazy(() => import('../pages/admin/SubscriptionsManagement'))
const Settings = lazy(() => import('../pages/admin/Settings'))

export default function AppRoutes() {
  const location = useLocation()

  return (
    <Suspense fallback={<BoutiqueSpinner />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public / customer-facing */}
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/products" element={<PageTransition><Products /></PageTransition>} />
          <Route path="/shop" element={<PageTransition><Products /></PageTransition>} />
          <Route path="/collections" element={<PageTransition><Products /></PageTransition>} />
          <Route path="/collections/:category" element={<PageTransition><Products /></PageTransition>} />
          <Route path="/products/:id" element={<PageTransition><ProductDetails /></PageTransition>} />
          <Route path="/product/:id" element={<PageTransition><ProductDetails /></PageTransition>} />
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
          <Route path="/verify-otp" element={<PageTransition><VerifyOtp /></PageTransition>} />
          <Route path="/verify-login-otp" element={<PageTransition><VerifyLoginOtp /></PageTransition>} />
          <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
          <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
          <Route path="/wishlist" element={<PageTransition><Wishlist /></PageTransition>} />
          <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
          <Route path="/payment-success" element={<PageTransition><PaymentSuccess /></PageTransition>} />
          <Route path="/payment-failed" element={<PageTransition><PaymentFailed /></PageTransition>} />
          <Route path="/track-order" element={<PageTransition><TrackOrder /></PageTransition>} />
          <Route path="/track" element={<PageTransition><TrackOrder /></PageTransition>} />
          <Route path="/subscription" element={<PageTransition><Subscription /></PageTransition>} />

          {/* Customer — requires login */}
          <Route path="/checkout" element={<ProtectedRoute role="CUSTOMER"><PageTransition><Checkout /></PageTransition></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute role="CUSTOMER"><PageTransition><Orders /></PageTransition></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute role="CUSTOMER"><PageTransition><Orders /></PageTransition></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute role="CUSTOMER"><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute role="CUSTOMER"><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
          <Route path="/addresses" element={<ProtectedRoute role="CUSTOMER"><PageTransition><Addresses /></PageTransition></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute role="CUSTOMER"><PageTransition><Notifications /></PageTransition></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/login" element={<PageTransition><AdminLogin /></PageTransition>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute role="ADMIN"><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute role="ADMIN"><PageTransition><ProductsManagement /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/products/add" element={<ProtectedRoute role="ADMIN"><PageTransition><AddProduct /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/products/edit/:id" element={<ProtectedRoute role="ADMIN"><PageTransition><EditProduct /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute role="ADMIN"><PageTransition><CategoriesManagement /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute role="ADMIN"><PageTransition><OrdersManagement /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/customers" element={<ProtectedRoute role="ADMIN"><PageTransition><Customers /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/subscriptions" element={<ProtectedRoute role="ADMIN"><PageTransition><SubscriptionsManagement /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/inventory" element={<ProtectedRoute role="ADMIN"><PageTransition><Inventory /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/offers" element={<ProtectedRoute role="ADMIN"><PageTransition><OffersManagement /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/coupons" element={<ProtectedRoute role="ADMIN"><PageTransition><CouponsManagement /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute role="ADMIN"><PageTransition><Reviews /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute role="ADMIN"><PageTransition><Analytics /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute role="ADMIN"><PageTransition><Settings /></PageTransition></ProtectedRoute>} />

          {/* Fallback / 404 */}
          <Route path="*" element={<PageTransition><Home /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}
