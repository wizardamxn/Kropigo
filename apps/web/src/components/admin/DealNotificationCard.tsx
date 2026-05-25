'use client'
import { INotification } from '@/store/endpoints/notificationApi'

interface Props {
  notification: INotification
  onClick: () => void
}

export const DealNotificationCard = ({ notification, onClick }: Props) => {
  const { payload } = notification
  const isUnread = !notification.isRead

  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow
        ${isUnread ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}
      `}
    >
      {isUnread && (
        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mb-2" />
      )}

      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-gray-800">
            {payload.cropName} — {payload.quantity} {payload.unit}
          </p>
          <p className="text-green-600 font-medium">
            Rs.{payload.agreedPrice}/unit | Total: Rs.{payload.totalAmount}
          </p>
        </div>
        <p className="text-xs text-gray-400">
          {new Date(notification.createdAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="bg-green-50 rounded p-2">
          <p className="text-xs text-gray-500 mb-0.5">Kisan</p>
          <p className="font-medium text-gray-800">{payload.kisanName}</p>
          <p className="text-blue-600">{payload.kisanPhone}</p>
        </div>
        <div className="bg-orange-50 rounded p-2">
          <p className="text-xs text-gray-500 mb-0.5">Buyer</p>
          <p className="font-medium text-gray-800">{payload.buyerName}</p>
          <p className="text-blue-600">{payload.buyerPhone}</p>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        📍 {payload.farmDistrict}, {payload.farmState}
      </div>

      <div className="mt-3">
        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
          Action Required — QC Schedule Karein
        </span>
      </div>
    </div>
  )
}
