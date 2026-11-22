import React from 'react';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import { mockRecruiterData } from '../../data/mockRecruiterData';
import '../../styles/InterviewSchedule.css';

export const InterviewSchedule = () => {
  const { upcomingInterviews } = mockRecruiterData;

  return (
    <div className="int-schedule-card">
      {/* Header */}
      <div className="int-schedule-header">
        <div className="int-schedule-header-left">
          <div className="int-schedule-icon-box">
            <CalendarTodayRoundedIcon sx={{ fontSize: 16 }} />
          </div>
          <h3 className="int-schedule-title">
            Upcoming Interview Schedule
          </h3>
        </div>

        <button className="int-schedule-more-btn">
          <MoreHorizRoundedIcon sx={{ fontSize: 20 }} />
        </button>
      </div>

      {/* Schedule Items */}
      <div className="int-schedule-list">
        {upcomingInterviews.map((item) => (
          <div key={item.id} className="int-schedule-row">
            <span className="int-schedule-time">
              {item.time}
            </span>

            <div
              className="int-schedule-item-card"
              style={{
                backgroundColor: item.cardBg,
                borderLeft: `4px solid ${item.borderLeft}`,
              }}
            >
              <div className="int-schedule-content">
                <span className="int-schedule-job-title">
                  {item.title}
                </span>

                <div className="int-schedule-candidate-row">
                  <div
                    className="int-schedule-candidate-avatar"
                    style={{ backgroundColor: item.avatarColor }}
                  >
                    {item.candidate[0]}
                  </div>
                  <span className="int-schedule-candidate-name">
                    {item.candidate}
                  </span>
                </div>
              </div>

              <button
                onClick={() => alert(`Joining meeting with ${item.candidate}`)}
                className="int-schedule-join-btn"
              >
                Join
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterviewSchedule;
