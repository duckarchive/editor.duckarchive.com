import { NextPage } from "next";
import { Card, CardBody, CardFooter } from "@heroui/card";
import Image from "next/image";

import InspectorSrc from "@/public/images/inspector.png";
import KeySrc from "@/public/images/key.png";
import EggSrc from "@/public/images/egg.png";
import { Link } from "@heroui/link";

const projects = [
  {
    name: "Інспектор",
    description: "Сервіс для пошуку архівних справ за реквізитами.",
    url: "/inspector",
    image: InspectorSrc,
  },
  {
    name: "Каталог",
    description: "Пошукова система для архівних справ.",
    url: "/catalog",
    image: EggSrc,
  },
  {
    name: "Ключ",
    description:
      "Індекс осіб, які згадуються в архівних документах. (в розробці)",
    url: "/index",
    isComing: true,
    image: KeySrc,
  },
];

const WelcomePage: NextPage = () => {
  return (
    <section className="flex flex-col items-center justify-center gap-4 mt-8">
      <div className="inline-block max-w-xl justify-center">
        <h1 className="font-normal text-3xl">Оберіть проєкт для роботи</h1>
      </div>
      <div className="gap-2 grid grid-cols-1 md:grid-cols-2 max-w-xl pb-8">
        {projects.map((project) => (
          <Card
            isPressable={!project.isComing}
            isDisabled={project.isComing}
            key={project.url}
            as={Link}
            href={project.isComing ? undefined : project.url}
          >
            <CardBody className="overflow-visible p-0">
              <Image
                alt={`logo of ${project.name}`}
                className="w-full object-cover"
                src={project.image}
              />
            </CardBody>
            <CardFooter className="flex-col text-start items-start">
              <h3 className="uppercase font-bold">{project.name}</h3>
              <p className="text-sm">{project.description}</p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default WelcomePage;
