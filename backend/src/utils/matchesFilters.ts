export const matchesFilters = (profile: any, scouting: any): boolean => {
    if (!scouting.required_roles.some((role: string) => profile.roles.includes(role))) return false;
    if (!scouting.allowed_devices.includes(profile.device)) return false;
    if (scouting.min_age && profile.age < scouting.min_age) return false;
    if (scouting.max_age && profile.age > scouting.max_age) return false;
    if (!scouting.allowed_genders.includes(profile.gender)) return false;
    if (scouting.min_kd_ratio && profile.kd_ratio < scouting.min_kd_ratio) return false;
    if (scouting.min_average_damage && profile.average_damage < scouting.min_average_damage) return false;
    if (!scouting.ban_history_allowed && profile.ban_history) return false;
    return true;
};