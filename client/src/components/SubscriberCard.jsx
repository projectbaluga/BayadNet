import React from 'react';

const SubscriberCard = ({ subscriber, onPay, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'Overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'Due Today': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const isPaid = subscriber.status === 'Paid';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg text-gray-800">{subscriber.name}</h3>
          <p className="text-sm text-gray-500">Cycle: {subscriber.cycle}th of the month</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(subscriber.status)}`}>
            {subscriber.status.toUpperCase()}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(subscriber)}
              className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(subscriber._id)}
              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end mt-2">
        <div>
          <p className="text-xs text-gray-400 uppercase font-semibold">Due Date</p>
          <p className="font-medium">{subscriber.dueDate}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase font-semibold">Amount</p>
          <p className="text-xl font-bold text-indigo-600">₱{subscriber.amountDue}</p>
        </div>
      </div>

      {subscriber.creditType !== 'None' && (
        <div className="bg-indigo-50 px-3 py-2 rounded-lg">
          <p className="text-xs text-indigo-700">
            ✨ <span className="font-semibold">Credit:</span> {subscriber.creditType}
            {subscriber.creditPreference !== 'None' && (
              <span> ({subscriber.creditPreference})</span>
            )}
          </p>
          {subscriber.creditPreference === 'Extension' && (
            <p className="text-[10px] text-indigo-500 mt-0.5">
              Due date extended by 14 days from original cycle ({subscriber.cycle}th)
            </p>
          )}
        </div>
      )}

      {!isPaid && (
        <button
          onClick={() => onPay(subscriber._id)}
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl mt-2 active:scale-95 transition-transform shadow-lg shadow-indigo-200"
        >
          MARK AS PAID
        </button>
      )}
    </div>
  );
};

export default SubscriberCard;
