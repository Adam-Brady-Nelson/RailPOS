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
    <div className="mt-6">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border px-3 py-2 text-left">Name</th>
            <th className="border px-3 py-2 text-left">Phone</th>
            <th className="border px-3 py-2 text-left">Address</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="border px-3 py-3 text-gray-600" colSpan={3}>Searching…</td>
            </tr>
          ) : (open && suggestions.length > 0 ? (
            suggestions.map(s => (
              <tr
                key={s.id}
                className="hover:bg-gray-50 cursor-pointer select-none suggestion-row"
                onClick={() => onChoose(s)}
              >
                <td className="border px-3 py-3 text-base">{s.name}</td>
                <td className="border px-3 py-3 text-base">{s.phone}</td>
                <td className="border px-3 py-3 text-base">{s.address}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="border px-3 py-3 text-gray-500" colSpan={3}>No matches</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SuggestionsTable;
