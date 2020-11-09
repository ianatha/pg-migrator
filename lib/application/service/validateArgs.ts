function validateArgs(messages: any, args: any[]): boolean {
    if (args.length == 0) {
        // There is no argument provided but connection string argument is mandatory
        console.log(messages.CONNECTION_STRING_MUST_BE_PROVIDED.error);
        return false;
    } else if (args.length > 1) {
        // Target version provided, check if valid
        if (isNaN(args[1])) {
            console.log(messages.INVALID_TARGET_VERSION.error);
            return false;
        }
    }

    return true;
}

module.exports = validateArgs;
