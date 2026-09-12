from pathlib import Path

root = Path('quickapp/velaclaw-aiot')

# Today: keep the shared pageIndex/controller logic, but make each Rect page consume
# the full 228px square-screen canvas instead of a compact half-height composition.
today = root / 'src/pages/today/today.ux'
source = today.read_text(encoding='utf-8')
css_start = source.index('.rect-surface {')
css_end = source.index('</style>', css_start)
rect_css = '''.rect-surface { position: absolute; width: 164px; height: 228px; flex-direction: column; align-items: center; }
.rect-date-card { width: 164px; height: 48px; margin-top: 6px; border-radius: 12px; background-color: #15171B; flex-direction: row; align-items: center; }
.rect-date { width: 56px; height: 48px; flex-direction: row; align-items: center; justify-content: center; } .rect-day { font-size: 30px; color: #FFFFFF; font-weight: bold; } .rect-month { font-size: 7px; color: #FF375F; margin-left: 3px; margin-top: 11px; }
.rect-copy { width: 76px; flex-direction: column; } .rect-weekday { font-size: 11px; color: #FFFFFF; font-weight: bold; } .rect-lunar { font-size: 6px; color: #8E8E93; margin-top: 3px; } .rect-goal { width: 30px; font-size: 12px; color: #30D158; text-align: center; font-weight: bold; }
.rect-goal-row { width: 160px; height: 18px; margin-top: 7px; flex-direction: row; justify-content: space-between; align-items: center; } .rect-summary-title { font-size: 9px; color: #FFFFFF; font-weight: bold; } .rect-goal-copy { font-size: 7px; color: #30D158; }
.rect-goal-track { width: 160px; height: 5px; border-radius: 3px; background-color: #242426; } .rect-goal-fill { height: 5px; border-radius: 3px; background-color: #30D158; }
.rect-summary-grid { width: 160px; height: 112px; margin-top: 8px; flex-direction: column; }
.rect-summary-row { width: 160px; height: 52px; flex-direction: row; justify-content: center; } .rect-row-bottom { margin-top: 8px; }
.rect-summary-card { width: 77px; height: 52px; border-radius: 10px; flex-direction: column; justify-content: center; align-items: center; } .rect-card-right { margin-left: 6px; }
.rect-card-label { width: 69px; height: 10px; font-size: 6px; color: #8E8E93; text-align: center; } .rect-card-value { width: 69px; height: 22px; margin-top: 2px; font-size: 15px; color: #FFFFFF; font-weight: bold; text-align: center; lines: 1; } .rect-step-value { font-size: 12px; } .rect-card-unit { width: 69px; height: 9px; margin-top: 1px; font-size: 5px; color: #636366; text-align: center; }
.rect-action { width: 100px; height: 26px; margin-top: 4px; border-radius: 10px; background-color: #222226; justify-content: center; align-items: center; } .rect-action-text { width: 92px; font-size: 7px; color: #FF375F; text-align: center; }
.rect-calendar-head { width: 164px; height: 32px; margin-top: 8px; flex-direction: row; justify-content: space-between; align-items: center; } .rect-calendar-title { width: 112px; font-size: 12px; color: #FFFFFF; font-weight: bold; text-align: center; } .rect-nav { width: 26px; height: 30px; justify-content: center; align-items: center; } .rect-nav-text { font-size: 19px; color: #FF375F; }
.rect-week-row, .rect-calendar-grid { width: 161px; flex-direction: row; flex-wrap: wrap; } .rect-week-row { height: 22px; margin-top: 3px; } .rect-week { width: 23px; font-size: 7px; color: #8E8E93; text-align: center; }
.rect-calendar-grid { height: 144px; margin-top: 2px; } .rect-cell { width: 23px; height: 24px; justify-content: center; align-items: center; } .rect-cell-text { width: 21px; height: 21px; border-radius: 10px; font-size: 8px; text-align: center; }
.rect-calendar-back { margin-top: 5px; }
'''
source = source[:css_start] + rect_css + source[css_end:]
today.write_text(source, encoding='utf-8')

# Rect mechanical face is square-native and must not depend on the Circle 60-tick array.
clock = root / 'src/pages/clock/clock.ux'
source = clock.read_text(encoding='utf-8')
needle = ' analog-ticks="{{ analogTicks }}"'
start = source.index('<mechanicalrect ')
end = source.index('</mechanicalrect>', start)
segment = source[start:end]
segment = segment.replace(needle, '')
source = source[:start] + segment + source[end:]
clock.write_text(source, encoding='utf-8')

# Lock the new square-screen contracts.
test = root / 'test/text_fit_regressions.test.js'
source = test.read_text(encoding='utf-8')
source = source.replace(
    "assert.ok(mechanicalRect.includes('analogTicks') && mechanicalRect.includes('hourHandTransform') && mechanicalRect.includes('minuteHandTransform'), 'Rect mechanical face must reuse the single Clock analog projection')",
    "assert.ok(!mechanicalRect.includes('analogTicks') && mechanicalRect.includes('rect-chapter') && mechanicalRect.includes('hourHandTransform') && mechanicalRect.includes('minuteHandTransform'), 'Rect mechanical face must use square-native geometry while reusing only hand angles')"
)
if "Rect Today summary must fill the square canvas" not in source:
    marker = "assert.ok(todayPage.includes('rect-summary-grid') && todayPage.includes('openCalendar') && todayPage.includes('closeCalendar'), 'Rect Today must expose readable 2x2 summary cards and reuse shared calendar actions')\n"
    extra = "assert.ok(todayPage.includes('.rect-surface { position: absolute; width: 164px; height: 228px;'), 'Rect Today summary must fill the square canvas')\nassert.ok(todayPage.includes('.rect-calendar-grid { height: 144px;'), 'Rect calendar must use the full square-screen height')\nassert.ok(sportRect.includes('height: 228px;') && simpleRect.includes('height: 228px;') && dashboardRect.includes('height: 228px;'), 'Rect digital watchfaces must explicitly fill the 228px square canvas')\nassert.ok(!clockPage.includes('<mechanicalrect') || !clockPage.slice(clockPage.indexOf('<mechanicalrect'), clockPage.indexOf('</mechanicalrect>')).includes('analog-ticks'), 'Rect Clock must not feed Circle tick geometry into the square analog face')\n"
    source = source.replace(marker, marker + extra)
test.write_text(source, encoding='utf-8')
