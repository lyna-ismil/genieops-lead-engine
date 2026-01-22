export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export interface ApiError {
    message: string;
    status?: number;
    details?: any;
}

export const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(options?.headers || {})
            }
        });

        // Handle specific 204 No Content if needed, though usually we return JSON
        if (response.status === 204) {
            return {} as T;
        }


        const text = await response.text();
        let json;
        try {
            json = text ? JSON.parse(text) : {};
        } catch (e) {
            console.error("Failed to parse JSON response:", text);
             if (!response.ok) {
                 throw { message: `Server Error (${response.status}): ${text}`, status: response.status } as ApiError;
             }
             // If OK but not JSON, maybe it was meant to be empty?
             return {} as T;
        }

        if (!response.ok) {
            const message = json?.error?.message || json?.detail || `Request failed with status ${response.status}`;
            throw { message, status: response.status, details: json } as ApiError;
        }
        
        // Backend standard success format: { success: true, data: ... }
        if (json && typeof json === 'object' && 'data' in json) {
            return json.data as T;
        }

        return json as T;

    } catch (e: any) {
        // If it's already an ApiError, rethrow
        if (e.message && e.status) {
            throw e;
        }
        // Network errors etc
        console.error("API Request Error:", e);
        throw { message: e.message || "Network error", status: 0 } as ApiError;
    }
};

export const get = async <T>(path: string): Promise<T> => {
    return request<T>(path, { method: 'GET' });
};

export const post = async <T>(path: string, body: any): Promise<T> => {
    return request<T>(path, {
        method: 'POST',
        body: JSON.stringify(body)
    });
};
