import "./Spinner.css";

export function Spinner() {
  return (
    <div className="spinner-container">
      <div className="spinner">
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
      </div>
      <p className="spinner-text">Loading listings...</p>
    </div>
  );
}
