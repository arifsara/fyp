"""
Standby Support Service (removed).

This module previously implemented the automated standby queue system.
It has been intentionally disabled and left as a placeholder so imports
fail loudly if re-introduced.
"""

raise ImportError(
    "StandbyService has been removed. The standby feature is disabled and "
    "all related tables have been dropped. Remove any imports or usage of "
    "`services.standby_service` from your code."
)

