type CustomToastProps = {
  message: string;
  type: "success" | "error" | "info" | "warning";
  onClose: () => void;
};
export default function CustomToast({
  message,
  type,
  onClose,
}: CustomToastProps) {
  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "info":
        return "bg-blue-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };
  return (
    <div
      className={`p-10 rounded-md flex items-center text-white ${getBackgroundColor()} `}
    >
      <span className="flex-1">{message}</span>
      <button
        className="ml-4 text-sm font-semibold underline"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
} 