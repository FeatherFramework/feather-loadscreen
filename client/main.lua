local closed = false

local function CloseLoadscreen(reason)
    if closed then return false end
    closed = true

    -- Cfx has already completed the game loading layer by the time Character
    -- is ready. With manual NUI shutdown enabled, only close Feather's retained
    -- loading-screen NUI. Calling ShutdownLoadingScreen here exposes RedM's
    -- black-and-white bridge/loading imagery between the two UIs.
    ShutdownLoadingScreenNui()

    print(('[feather-loadscreen] load screen closed (%s)'):format(tostring(reason)))

    if reason == 'fallback' then
        print('[feather-loadscreen] manual shutdown fallback reached before Character readiness')
    end
    TriggerEvent('feather-loadscreen:client:closed', reason)
    return true
end

-- Feather Character emits this only after its first usable menu has opened.
AddEventHandler('feather-loadscreen:client:character-ready', function()
    if FeatherLoadscreenConfig.ManualShutdown == true then
        CloseLoadscreen('character-ready')
    end
end)

CreateThread(function()
    while not NetworkIsSessionStarted() do Wait(100) end

    if FeatherLoadscreenConfig.ManualShutdown ~= true then
        CloseLoadscreen('network-session')
        return
    end

    local fallbackMs = math.max(0, math.floor(
        tonumber(FeatherLoadscreenConfig.ManualShutdownFallbackMs) or 120000
    ))
    if fallbackMs == 0 then return end

    Wait(fallbackMs)
    CloseLoadscreen('fallback')
end)
