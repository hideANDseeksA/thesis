import { Timeline, Text } from "@mantine/core";
import { IconActivity, IconHeartbeat } from "@tabler/icons-react";
import { Pill } from "./atoms";

export const VisitTimeline = ({ visits, trimester }) => {
  const rows = (visits?.[trimester] ?? []).filter((v) => v?.date);
  if (!rows.length)
    return (
      <p className="text-xs text-muted-foreground text-center py-3">No visits recorded</p>
    );
  return (
    <Timeline active={rows.length - 1} bulletSize={20} lineWidth={2} color="pink">
      {rows.map((v, i) => (
        <Timeline.Item
          key={i}
          bullet={<IconActivity size={10} />}
          title={<Text size="xs" fw={600}>{v.date}</Text>}
        >
          <div className="flex flex-wrap gap-1 mt-1">
            {v.weight && (
              <Pill className="border border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300">
                Wt/BP: {v.weight}
              </Pill>
            )}
            {v.aog && (
              <Pill className="border border-violet-300 text-violet-700 dark:border-violet-700 dark:text-violet-300">
                AOG: {v.aog}
              </Pill>
            )}
            {v.tt && (
              <Pill className="border border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-300">
                TT: {v.tt}
              </Pill>
            )}
            {v.iron && (
              <Pill className="border border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300">
                Iron/VA: {v.iron}
              </Pill>
            )}
            {v.urinalysis && (
              <Pill className="border border-cyan-300 text-cyan-700 dark:border-cyan-700 dark:text-cyan-300">
                UA: {v.urinalysis}
              </Pill>
            )}
          </div>
          {v.remarks && (
            <p className="text-xs text-muted-foreground mt-1">Remarks: {v.remarks}</p>
          )}
        </Timeline.Item>
      ))}
    </Timeline>
  );
};

export const PostPartumRows = ({ postPartum }) => {
  const rows = (postPartum ?? []).filter((r) => r?.date);
  if (!rows.length)
    return (
      <p className="text-xs text-muted-foreground text-center py-3">No post-partum records</p>
    );
  return (
    <Timeline active={rows.length - 1} bulletSize={20} lineWidth={2} color="teal">
      {rows.map((r, i) => (
        <Timeline.Item
          key={i}
          bullet={<IconHeartbeat size={10} />}
          title={<Text size="xs" fw={600}>{r.date}</Text>}
        >
          <div className="flex flex-wrap gap-1 mt-1">
            {r.bp && (
              <Pill className="border border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300">
                VS: {r.bp}
              </Pill>
            )}
            {r.fh && (
              <Pill className="border border-violet-300 text-violet-700 dark:border-violet-700 dark:text-violet-300">
                FH: {r.fh}
              </Pill>
            )}
            {r.b && (
              <Pill className="bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">
                Feeding: Breastfeeding
              </Pill>
            )}
            {r.bo && (
              <Pill className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                Feeding: Bottle
              </Pill>
            )}
            {r.mix && (
              <Pill className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                Feeding: Mixed
              </Pill>
            )}
            {r.vaginal && (
              <Pill className="border border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-300">
                Vaginal: {r.vaginal}
              </Pill>
            )}
            {r.iron && (
              <Pill className="border border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300">
                Iron/VA: {r.iron}
              </Pill>
            )}
          </div>
          {(r.observation || r.remarks) && (
            <p className="text-xs text-muted-foreground mt-1">{r.observation || r.remarks}</p>
          )}
        </Timeline.Item>
      ))}
    </Timeline>
  );
};