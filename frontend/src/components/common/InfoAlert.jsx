import React from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import '../../styles/InfoAlert.css';

export const InfoAlert = ({
  message = 'Your resume will be securely stored and only you can access it.',
}) => {
  return (
    <div className="info-alert-container">
      <div className="info-alert-icon-box">
        <InfoOutlinedIcon sx={{ fontSize: 16 }} />
      </div>
      <span className="info-alert-message">{message}</span>
    </div>
  );
};

export default InfoAlert;
