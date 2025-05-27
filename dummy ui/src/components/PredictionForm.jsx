import { useState } from 'react';
import Select from 'react-select';
import EditedData from '../../EditedData.json';
import './PredictionForm.css';

const getOptions = (arr) => arr.map(v => ({ value: v, label: String(v) }));

const allFields = Object.keys(EditedData);
const optionsMap = {};
allFields.forEach(field => {
  optionsMap[field] = getOptions(EditedData[field]);
});

const initialFormData = {};
allFields.forEach(field => {
  // Use the first value as default
  initialFormData[field] = Array.isArray(EditedData[field]) && EditedData[field].length > 0 ? EditedData[field][0] : '';
});

const PredictionForm = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const customSelectStyles = {
    option: (provided, state) => ({
      ...provided,
      color: '#111',
      backgroundColor: state.isSelected ? '#e0e7ff' : '#fff',
      fontWeight: state.isSelected ? 600 : 400,
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#111',
    }),
    input: (provided) => ({
      ...provided,
      color: '#111',
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 10,
    }),
  };

  const handleSelectChange = (name, option) => {
    setFormData(prev => ({
      ...prev,
      [name]: option.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Prepare data for API
      const dataToSend = { ...formData };
      if (typeof dataToSend.ready_reckoner_value === 'string') {
        dataToSend.ready_reckoner_value = Number(dataToSend.ready_reckoner_value.replace(/,/g, ''));
      }
      const response = await fetch('https://zafocrecode-production-f042.up.railway.app/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });
      if (!response.ok) {
        throw new Error('Failed to get prediction');
      }
      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormComplete = () => {
    return allFields.every(field => formData[field] !== undefined && formData[field] !== null && formData[field] !== '');
  };

  return (
    <div className="prediction-form-container">
      <h2>Property Price Prediction</h2>
      <form onSubmit={handleSubmit} className="prediction-form">
        {allFields.map(field => (
          <div className="form-group" key={field}>
            <label>{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</label>
            {field === 'ready_reckoner_value' ? (
              <input
                type="text"
                name={field}
                value={formData[field]}
                onChange={e => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
                placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                className="form-control"
              />
            ) : (
              <Select
                name={field}
                options={optionsMap[field]}
                value={optionsMap[field].find(option => option.value === formData[field])}
                onChange={option => handleSelectChange(field, option)}
                placeholder={`Select ${field}...`}
                isSearchable
                classNamePrefix="react-select"
                menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                styles={{
                  ...customSelectStyles,
                  menuPortal: base => ({ ...base, zIndex: 9999 }),
                  menu: base => ({ ...base, zIndex: 9999 })
                }}
              />
            )}
          </div>
        ))}
        <button type="submit" disabled={loading || !isFormComplete()}>
          {loading ? 'Getting Prediction...' : 'Get Prediction'}
        </button>
      </form>
      {error && <div className="error-message">{error}</div>}
      {prediction && (
        <div className="prediction-result">
          <h3>Predicted Price:</h3>
          <div className="price-display">
            ₹{Math.round(prediction.predicted_price_psf).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionForm; 