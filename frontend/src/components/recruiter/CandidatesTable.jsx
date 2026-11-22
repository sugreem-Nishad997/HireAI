import { useState } from 'react';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import LoadingIndicator from '../common/LoadingIndicator';
import '../../styles/CandidatesTable.css';

export const CandidatesTable = ({ candidates = [], loading, error }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="candidates-table-card">
      {/* Header */}
      <div className="candidates-table-header">
        <div className="candidates-table-header-left">
          <div className="candidates-icon-box">
            <PeopleAltOutlinedIcon sx={{ fontSize: 16 }} />
          </div>
          <h3 className="candidates-table-title">
            Candidates Database
          </h3>
        </div>

        <div className="candidates-table-controls">
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="candidates-search-input"
          />
          <button className="candidates-filter-btn">
            <FilterListRoundedIcon sx={{ fontSize: 16 }} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="candidates-table-scroll">
        <table className="candidates-table">
          <thead>
            <tr className="candidates-thead-tr">
              <th className="candidates-th">Candidate</th>
              <th className="candidates-th">Role</th>
              <th className="candidates-th">Match Score</th>
              <th className="candidates-th">Location</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.map((c) => (
              <tr key={c.id} className="candidates-tr">
                <td className="candidates-td-name">
                  {c.name}
                </td>
                <td className="candidates-td-role">
                  {c.role}
                </td>
                <td className="candidates-td-score">
                  <span className="candidates-score-pill">
                    {c.matchScore == null ? 'Pending' : `${c.matchScore}%`}
                  </span>
                </td>
                <td className="candidates-td-location">
                  {c.location}
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr className="candidates-tr">
                <td className="candidates-td-location" colSpan="4">
                  {error
                    ? 'Candidates could not be loaded.'
                    : candidates.length === 0
                    ? 'No applicants for your jobs yet.'
                    : 'No candidates match your search.'}
                </td>
              </tr>
            )}
            {loading && (
              <tr className="candidates-tr">
                <td className="candidates-td-location" colSpan="4">
                  <LoadingIndicator label="Loading candidates" size={22} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CandidatesTable;
