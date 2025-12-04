
export const post = async (url, obj, errorResponses, method = "POST") => {
    let response;
    try {
        response = await fetch(url, {
            method: method,
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            ...(method !== "GET" && { body: JSON.stringify(obj) })
        });

        if (!response.ok) {
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                console.log(errorStatus(response.status));
            } else  {
                response = await response.json();
                console.log(response);
            }
            if (errorResponses)
                errorResponses(response);
        }
    } catch (error) {
        console.error('Fetch request failed', error);
    }

    return response;
}

export const errorStatus = (status) => {
    return status +" "+ status < 300 ? 'Success' : status < 400 ? 'Redirection' : status < 500 ? 'Client/authorization Error' : 'Server Error';
}