
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
            console.log('contentType',contentType);
            if (!contentType || !contentType.includes("application/json") && !contentType.includes("application/problem+json")) {
                console.log("not json error ", errorStatus(response.status));
                if (errorResponses)
                    errorResponses(errorStatus(response));
            } else  {
                response = await response.json();
                console.log("application/json error",response);
                if (errorResponses)
                    errorResponses(response);
            }
        }
    } catch (error) {
        console.error('Fetch request failed', error);
    }

    return response;
}

export const errorStatus = (status) => {
    return status +" "+ status < 300 ? 'Success' : status < 400 ? 'Redirection' : status < 500 ? 'Client/authorization Error' : 'Server Error';
}