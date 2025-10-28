import React from 'react';
import './SuggestionsTable.css';

export type CustomerSuggestion = { id: number; name: string; phone: string; address: string };

interface SuggestionsTableProps {
  loading: boolean;
  open: boolean;
  suggestions: CustomerSuggestion[];
  onChoose: (s: CustomerSuggestion) => void;
}

const SuggestionsTable: React.FC<SuggestionsTableProps> = ({ loading, open, suggestions, onChoose }) => {
  return (
    <div className="suggestions-table__container">
      <table className="suggestions-table">
        <thead>
          <tr>
            <th className="suggestions-table__th suggestions-table__th--left">Name</th>
            <th className="suggestions-table__th suggestions-table__th--left">Phone</th>
            <th className="suggestions-table__th suggestions-table__th--left">Address</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="suggestions-table__td suggestions-table__td--loading" colSpan={3}>Searching…</td>
            </tr>
          ) : (open && suggestions.length > 0 ? (
            suggestions.map(s => (
              <tr
                key={s.id}
                className="suggestion-row suggestions-table__row"
                onClick={() => onChoose(s)}
              >
                <td className="suggestions-table__td">{s.name}</td>
                <td className="suggestions-table__td">{s.phone}</td>
                <td className="suggestions-table__td">{s.address}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="suggestions-table__td suggestions-table__td--empty" colSpan={3}>No matches</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SuggestionsTable;
