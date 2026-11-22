import Alert from '@mui/material/Alert';

const FeedbackAlert = ({severity = 'info', children, onClose, className = ''}) => (
  <Alert
    severity={severity}
    onClose={onClose}
    className={className}
    sx={{mb: 2}}
  >
    {children}
  </Alert>
);

export default FeedbackAlert;
