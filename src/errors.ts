import { AppException } from "@lib/exception";

export const error = {
    RecordNotFound: AppException.base("The database record was not found", 1),
    UserDoesNotExist: AppException.base("user does not exist", 10),
    UserAlreadyExists: AppException.base("user already exists", 11),
    UserNotActivated: AppException.base("activation required", 100),
    InvalidActivateToken: AppException.base("invalid token", 101),
    InvalidResetToken: AppException.base("invalid token", 110),
    PasswordTooShort: AppException.base("password too short", 200),
    PasswordNeedsUpperChar: AppException.base("password needs upper char", 201),
    PasswordNeedsLowerChar: AppException.base("password needs lower char", 202),
    PasswordNeedsDigit: AppException.base("password needs digit", 203),
    InvalidPassword: AppException.base("invalid password", 220),
    InvalidEmailAddress: AppException.base("email address is not valid", 221),
    AccessTokenLimit: AppException.base("device login limit exceeded", 230),
    ConsumerDoesNotExist: AppException.base("consumer key does not exist.", 300),
    OrganizationDoesNotExist: AppException.base("organization does not exist", 500),
    ProjectDoesNotExist: AppException.base("project does not exist", 510),
    UserAlreadyLinkedToProject: AppException.base("user is already linked to project", 511),
    InviteTokenNotFound: AppException.base("invite token does not exist", 600),
    PolicyDoesNotExist: AppException.base("policy does not exist", 700),
    RequiresAdminPolicy: AppException.base("Administrative policy does not exist", 700),
};
