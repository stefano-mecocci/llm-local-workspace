function fileToBase64(file: File, withPrefix = true): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            let result = reader.result as string;

            if (!withPrefix) {
                result = result.split(',')[1];
            }

            resolve(result);
        };

        reader.onerror = (error) => reject(error);

        reader.readAsDataURL(file);
    });
}

export default fileToBase64;