export default function validateArgs(messages: any, args: any[]): object {
    var isValid = true;
    var connectionString;
    var targetVersion = 0;

    if (args.length == 0) {
        // There is no argument provided but connection string argument is mandatory
        console.log(messages.CONNECTION_STRING_MUST_BE_PROVIDED.error);
        isValid = false;
    } else if (args.length > 1) {
        // Target version provided, check if valid
        if (isNaN(args[1])) {
            console.log(messages.INVALID_TARGET_VERSION.error);
            isValid = false;
        }
    }

    if (isValid) {
        connectionString = args[0];
        targetVersion = 0;

        // if targetVersion stays 0 means that, target version does not provided by user
        // so it will be obtained from script files (the biggest target version number in all files)
        if (args.length > 1) {
            targetVersion = args[1];
        }
    }

    return {
        isValid,
        connectionString,
        targetVersion
    };
}
