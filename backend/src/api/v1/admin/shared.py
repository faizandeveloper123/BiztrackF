def is_super_admin(current_user) -> bool:
    return current_user.userRole == "super_admin"
