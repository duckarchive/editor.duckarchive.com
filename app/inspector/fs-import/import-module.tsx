"use client";

import { FSItemsFreshResponse } from "@/app/api/inspector/fs-items/fresh/route";
import { useGet } from "@/hooks/useApi";
import { parseCode, parseMeta } from "@duckarchive/framework";

const ImportModule: React.FC = () => {
  const { data } = useGet<FSItemsFreshResponse>("/api/inspector/fs-items/fresh");

  return (
    <div>
      {data?.map((item) => (
        <div key={item.id}>
          <h3>{item.project.archive?.code} | {item.volumes}</h3>
        </div>
      ))}
    </div>
  );
};

export default ImportModule;
