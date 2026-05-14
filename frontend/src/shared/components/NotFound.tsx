import { Link } from "react-router-dom";
import "./NotFound.css";

export function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-code">404</div>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-message">
          Sorry, the page you're looking for doesn't exist.
        </p>
        <Link to="/" className="not-found-link">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
