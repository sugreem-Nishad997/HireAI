import React from 'react';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import StatCard from '../common/StatCard';
import { useResumes } from '../../context/ResumeContext';
import '../../styles/DashboardStats.css';

export const DashboardStats = () => {
  const { stats } = useResumes();

  const cards = [
    {
      title: 'Total Resumes',
      value: stats.total,
      icon: DescriptionOutlinedIcon,
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
    },
    {
      title: 'Parsed Successfully',
      value: stats.completed,
      icon: CheckCircleOutlineRoundedIcon,
      iconBg: '#DCFCE7',
      iconColor: '#16A34A',
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: AccessTimeRoundedIcon,
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
    },
    {
      title: 'Failed',
      value: stats.failed,
      icon: CancelOutlinedIcon,
      iconBg: '#FEE2E2',
      iconColor: '#DC2626',
    },
  ];

  return (
    <div className="dashboard-stats-grid">
      {cards.map((c, idx) => (
        <StatCard key={idx} {...c} />
      ))}
    </div>
  );
};

export default DashboardStats;
