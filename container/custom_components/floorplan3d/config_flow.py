"""The dialog: where the floorplan3d container is (Settings → Devices & services → Add integration → 3D Floorplan (Container)).

The address is checked against the plan's own login before it is stored, so a wrong address, a stopped container or an add-on style
container (no HA_LOGIN) is an error in the dialog instead of a broken dashboard card.
"""
from __future__ import annotations

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.data_entry_flow import FlowResult

from . import boundary, const, handshake


def _schema(address: str) -> vol.Schema:
    return vol.Schema({vol.Required(const.CONF_ADDRESS, default=address): str})


class Floorplan3dConfigFlow(config_entries.ConfigFlow, domain=const.DOMAIN):
    """one plan per Home Assistant: the address /floorplan/ is fixed, so a second entry would serve the same page"""

    VERSION = 1

    async def async_step_user(self, user_input=None) -> FlowResult:
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        errors = {}
        address = (user_input or {}).get(const.CONF_ADDRESS, const.DEFAULT_ADDRESS)
        if user_input is not None:
            normalised = boundary.normalise_address(address)
            if not normalised:
                errors["base"] = "invalid_address"
            else:
                reason = await handshake.probe(normalised)
                if reason:
                    errors["base"] = reason
                else:
                    return self.async_create_entry(title=normalised, data={const.CONF_ADDRESS: normalised})
        return self.async_show_form(step_id="user", data_schema=_schema(address), errors=errors)

    async def async_step_reconfigure(self, user_input=None) -> FlowResult:
        """the container moved: change the address without removing and adding the integration"""
        entry = self.hass.config_entries.async_get_entry(self.context["entry_id"])
        if entry is None:                                   # removed meanwhile
            return self.async_abort(reason="entry_not_found")
        errors = {}
        address = (user_input or {}).get(const.CONF_ADDRESS, entry.data.get(const.CONF_ADDRESS, const.DEFAULT_ADDRESS))
        if user_input is not None:
            normalised = boundary.normalise_address(address)
            if not normalised:
                errors["base"] = "invalid_address"
            else:
                reason = await handshake.probe(normalised)
                if reason:
                    errors["base"] = reason
                else:
                    self.hass.config_entries.async_update_entry(
                        entry, title=normalised, data={**entry.data, const.CONF_ADDRESS: normalised})
                    await self.hass.config_entries.async_reload(entry.entry_id)
                    return self.async_abort(reason="reconfigure_successful")
        return self.async_show_form(step_id="reconfigure", data_schema=_schema(address), errors=errors)
