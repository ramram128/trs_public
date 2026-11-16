import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function NotFoundPage() {
  return (
    <>
      <Helmet><title>Page Not Found — TRS Products</title></Helmet>
      <div className="bg-gray-50 min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-8xl font-black text-green-900 mb-4">404</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-500 mb-6">The page you're looking for doesn't exist or has been moved.</p>
          <Link to="/" className="bg-green-900 hover:bg-green-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    </>
  );
}
