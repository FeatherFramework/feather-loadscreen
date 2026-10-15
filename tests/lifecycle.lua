local function scenario(config)
    local handlers, events, waits, logs = {}, {}, {}, {}
    local started, calls, fail = false, 0, false
    local thread
    local env = setmetatable({
        FeatherLoadscreenConfig = config,
        AddEventHandler = function(name, fn) handlers[name] = fn end,
        CreateThread = function(fn) thread = coroutine.create(fn) end,
        NetworkIsSessionStarted = function() return started end,
        Wait = function(ms) waits[#waits+1] = ms; coroutine.yield() end,
        ShutdownLoadingScreenNui = function() calls = calls + 1; if fail then error('native failed') end end,
        TriggerEvent = function(name, reason) events[#events+1] = {name, reason} end,
        print = function(msg) logs[#logs+1] = msg end,
    }, {__index = _G})
    assert(loadfile('client/main.lua', 't', env))()
    return {
        ready = function() handlers['feather-loadscreen:client:character-ready']() end,
        step = function() assert(coroutine.resume(thread)) end,
        start = function() started = true end,
        fail = function(value) fail = value end,
        calls = function() return calls end,
        events = events, waits = waits, logs = logs,
    }
end
local s = scenario({ManualShutdown=true, ManualShutdownFallbackMs=1000})
s.ready(); s.ready(); s.start(); s.step()
assert(s.calls()==1 and #s.events==1 and #s.waits==0)
s = scenario({ManualShutdown=true, ManualShutdownFallbackMs=1000})
s.step(); assert(s.waits[1]==100 and s.calls()==0)
s.start(); s.step(); assert(s.waits[2]==1000 and s.calls()==0)
s.ready(); s.step(); assert(s.calls()==1 and #s.events==1)
s = scenario({ManualShutdown=true, ManualShutdownFallbackMs=1000})
s.start(); s.step(); s.step(); assert(s.events[1][2]=='fallback')
s = scenario({ManualShutdown=true, ManualShutdownFallbackMs=0})
s.start(); s.step(); assert(s.calls()==0 and #s.waits==0); s.ready(); assert(s.calls()==1)
s = scenario({ManualShutdown=false})
s.ready(); assert(s.calls()==0); s.start(); s.step(); s.ready(); assert(s.events[1][2]=='network-session' and s.calls()==1)
for _, bad in ipairs({'bad', -1, 600001, 1.5, math.huge, -math.huge, 0/0}) do
    s = scenario({ManualShutdown='false', ManualShutdownFallbackMs=bad})
    s.start(); s.step(); assert(s.waits[1]==120000); s.step(); assert(#s.events==1)
end
s = scenario(false); s.start(); s.step(); assert(s.waits[1]==120000)
s = scenario({ManualShutdown=true, ManualShutdownFallbackMs=1000})
s.fail(true); s.ready(); assert(#s.events==0 and #s.logs==1)
s.start(); s.step(); s.fail(false); s.step(); s.ready(); assert(s.calls()==2 and #s.events==1)
assert(s.events[1][1]=='feather-loadscreen:client:closed')
print('Lifecycle behavior passed (early/late/duplicate ready, automatic, fallback, invalid config, native failure).')
