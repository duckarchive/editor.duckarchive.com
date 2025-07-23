import { Card, CardBody } from "@heroui/card";
import { startCase } from "lodash";
import Link from "next/link";
import { FaDatabase } from "react-icons/fa";

interface SelectTableProps {
  title: string;
  description?: string;
  prefix: string;
  items: { table_name: string }[];
}

const SelectTable: React.FC<SelectTableProps> = ({
  items,
  title,
  description,
  prefix,
}) => {
  return (
    <div>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          {description && <p className="text-gray-600">{description}</p>}
        </div>

        <div className="flex gap-4">
          {items.map(({ table_name }) => (
            <Link key={table_name} href={`${prefix}/${table_name}`}>
              <Card className="cursor-pointer border-2 border-transparent hover:border-blue-300">
                <CardBody className="flex-row items-center gap-2">
                  <FaDatabase className="w-12 h-12 text-gray-400" />
                  <div>
                    <h3 className="font-semibold capitalize">
                      {startCase(table_name)}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{table_name}</p>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12">
            <FaDatabase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Таблиці не знайдено
            </h3>
            <p className="text-gray-500">
              В базі даних немає доступних таблиць
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectTable;
