import CircularProgress from '@mui/material/CircularProgress';

const LoadingIndicator = ({label = 'Loading', size = 28, className = ''}) => (
  <div
    className={className}
    role="status"
    aria-label={label}
    style={{display: 'flex', justifyContent: 'center', padding: '32px 16px'}}
  >
    <CircularProgress size={size} aria-label={label} />
  </div>
);

export default LoadingIndicator;
