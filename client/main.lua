local raw = type(FeatherLoadscreenConfig) == 'table' and FeatherLoadscreenConfig or {}
local manual = raw.ManualShutdown
if type(manual) ~= 'boolean' then manual = true end
local fallback = raw.ManualShutdownFallbackMs
if type(fallback) ~= 'number' or fallback ~= fallback or fallback == math.huge
    or fallback == -math.huge or fallback < 0 or fallback > 600000
    or fallback % 1 ~= 0 then fallback = 120000 end
local closed = false
local closing = false

local function CloseLoadscreen(reason)
    if closed or closing then return false end
    closing = true
    -- Only the retained NUI: the game loading layer would expose bridge imagery.
    local ok, err = pcall(function() ShutdownLoadingScreenNui() end)
    closing = false
    if not ok then
        print(('[feather-loadscreen] NUI shutdown failed (%s): %s'):format(reason, tostring(err)))
        return false -- A later ready/fallback signal may retry; never report success.
    end
    closed = true
    print(('[feather-loadscreen] load screen closed (%s)'):format(reason))
    if reason == 'fallback' then
        print('[feather-loadscreen] manual shutdown fallback reached before Character readiness')
    end
    TriggerEvent('feather-loadscreen:client:closed', reason)
    return true
end

AddEventHandler('feather-loadscreen:client:character-ready', function()
    if manual then CloseLoadscreen('character-ready') end
end)

CreateThread(function()
    while not NetworkIsSessionStarted() do Wait(100) end
    if closed then return end
    if not manual then
        CloseLoadscreen('network-session')
        return
    end
    if fallback == 0 then return end
    Wait(fallback)
    CloseLoadscreen('fallback')
end)
