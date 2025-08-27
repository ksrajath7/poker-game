import usePostData from "./api/usePostData";

const useHandleImageUpload = () => {
    const { postData, isLoading } = usePostData({});

    const handleImageUpload = ({ image, ImageUrl }, callback, onError) => {
        if (image) {
            postData({
                endpoint: "files/upload",
                payload: image,
                onsuccess: (result) => {
                    if (result?.FileUrl) {
                        callback(result.FileUrl);
                    } else {
                        onError?.("Failed to upload image");
                    }
                },
                onerror: () => {
                    onError?.("Image upload failed");
                },
            });
        } else {
            callback(ImageUrl);
        }
    };

    return { handleImageUpload, isLoading };
};

export default useHandleImageUpload;