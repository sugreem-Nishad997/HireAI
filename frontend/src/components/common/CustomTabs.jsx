import React from 'react';
import '../../styles/CustomTabs.css';

export const CustomTabs = ({ tabs = [], activeTab, onTabChange }) => {
  return (
    <div className="custom-tabs-container">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`custom-tab-button ${isActive ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default CustomTabs;
