import usePostData from "./api/usePostData";

const useHandleMultipleImagesUpload = () => {
    const { postData, isLoading } = usePostData({});

    const handleMultipleImagesUpload = (images, callback, onError) => {
        const uploadedUrls = [];

        const uploadNext = (index) => {
            if (index >= images.length) {
                callback(uploadedUrls);
                return;
            }

            postData({
                endpoint: "files/upload",
                payload: images[index],
                onsuccess: (result) => {
                    if (result?.FileUrl) {
                        uploadedUrls.push(result.FileUrl);
                        uploadNext(index + 1);
                    } else {
                        onError?.("Failed to upload image");
                    }
                },
                onerror: () => {
                    onError?.("Image upload failed");
                },
            });
        };

        if (images.length > 0) {
            uploadNext(0);
        } else {
            callback([]);
        }
    };

    return { handleMultipleImagesUpload, isLoading };
};

export default useHandleMultipleImagesUpload;