
export const post = async (url, obj, errorResponses, method = "POST") => {
    let response;
    const API_BASE = import.meta.env.VITE_DEV_SERVER_PORT ? `http://localhost:${import.meta.env.VITE_DEV_SERVER_PORT}` : "";
    const fullurl = API_BASE + url;
    let msg = "";
    try {
        response = await fetch(fullurl, {
            method: method,
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            ...(method !== "GET" && { body: JSON.stringify(obj) })
        });

        if (!response.ok) {
            try {
                const contentType = response.headers.get("content-type");
                if (contentType?.includes("application/json") || contentType?.includes("application/problem+json"))
                    msg = await response.clone().json();
                else if (contentType?.includes("text/plain"))
                    msg = await response.clone().text();
                else
                    msg = errorStatus(response.status)
            } catch (error) {
                msg = error;
            }

            if (errorResponses)
                errorResponses(msg);

            console.log("error: ", JSON.stringify(msg));
        }
    } catch (error) {
        console.error('Fetch request failed', error);
    }

    return { ok: response.ok, status: response.status, json: () => response.json(), error: msg.error, response };
}

export const errorStatus = (status) => {
    let msg = status < 300 ? 'Success' : status < 400 ? 'Redirection' : status < 500 ? 'Client/authorization Error' : 'Server Error';
    return status + " " + msg;
}