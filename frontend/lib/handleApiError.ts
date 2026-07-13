type ErrorLike = {
    message? : unknown;
    error? : {
        message?:unknown;
    };
    response?: {
        data?: {
            error?:{
                message?:unknown;
            };
        };
    };
};

function isErrorLike(error:unknown):error is ErrorLike {
    return typeof error === "object" && error !== null ;
}

export function handleApiError(
    error:unknown,
    defaultmessage="Something went wrong",
) : string {
    if(!isErrorLike(error)) {
        return typeof error === "string" ? error : defaultmessage ;
    }
    const responseMessage = error.response?.data?.error?.message ;

    if(typeof responseMessage === "string") {
        return responseMessage;
    }

    const nestedMessage = error.error?.message ;

    if(typeof nestedMessage === "string") {
        return nestedMessage;
    }

    if(typeof error.message === "string") {
        return error.message ;
    }

    return defaultmessage;
}