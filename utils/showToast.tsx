import toast from "react-hot-toast";
import CustomToast from "../components/customToast/CustomToast";
export const showToast = (
  message: string,
  type: "success" | "error" | "info" | "warning"
) => {
  toast.custom((t) => (
    <CustomToast
      message={message}
      type={type}
      onClose={() => toast.dismiss(t.id)}
    />
  ));
};