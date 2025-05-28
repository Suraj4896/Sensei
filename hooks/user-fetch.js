import { useState } from "react";
import { toast } from "sonner";

const useFetch = (cb) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false); // Initialize as boolean
    const [error, setError] = useState(null);

    const fn = async (...args) => {
        setLoading(true);
        setError(null);
        try {
            const response = await cb(...args);
            setData(response);
            return response;
        } catch (error) {
            setError(error.message || "Something went wrong");
            toast.error(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error, fn, setData };
};

export default useFetch;