import { useTheme } from "../../context/ThemeContext";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
} from "./Accordion";
import ScoreBadge from "./ScoreBadge";

const CategoryHeader = ({ title, categoryScore }) => {
  const { darkMode } = useTheme();
  return (
    <div className="flex flex-row gap-4 max-sm:gap-2 items-center py-2 max-sm:py-1">
      <p className={`text-2xl max-md:text-xl max-sm:text-lg font-semibold ${
        darkMode ? 'text-white' : 'text-gray-900'
      }`}>
        {title}
      </p>
      <ScoreBadge score={categoryScore} />
    </div>
  );
};

const CategoryContent = ({ tips = [] }) => {
  const { darkMode } = useTheme();
  if (!tips || tips.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 items-center w-full">
      <div className={`w-full rounded-lg px-5 max-sm:px-3 py-4 grid grid-cols-2 max-sm:grid-cols-1 gap-4 max-sm:gap-3 transition-colors duration-300 ${
        darkMode ? 'bg-[#121212]' : 'bg-gray-50'
      }`}>
        {tips.map((tip, index) => (
          <div 
            className="flex flex-row gap-2 items-center animate-in fade-in slide-in-from-left-4 duration-500" 
            style={{ animationDelay: `${index * 100}ms` }}
            key={index}
          >
            <img
              src={tip.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"}
              alt="score"
              className="size-5 max-sm:size-4 flex-shrink-0"
            />
            <p className={`text-xl max-md:text-lg max-sm:text-base ${
              darkMode ? 'text-gray-300' : 'text-gray-500'
            }`}>
              {tip.tip}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 w-full">
        {tips.map((tip, index) => (
          <div
            key={index + tip.tip}
            className={`flex flex-col gap-2 rounded-2xl p-4 max-sm:p-3 transition-all duration-300 hover:scale-[1.01] animate-in fade-in slide-in-from-bottom-4 duration-500 ${
              tip.type === "good"
                ? darkMode
                  ? "bg-green-500/10 border border-green-500/30 text-green-400"
                  : "bg-green-50 border border-green-200 text-green-700"
                : darkMode
                ? "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400"
                : "bg-yellow-50 border border-yellow-200 text-yellow-700"
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex flex-row gap-2 items-center">
              <img
                src={tip.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"}
                alt="score"
                className="size-5 max-sm:size-4 flex-shrink-0"
              />
              <p className={`text-xl max-md:text-lg max-sm:text-base font-semibold ${
                tip.type === "good"
                  ? darkMode ? "text-green-300" : "text-green-700"
                  : darkMode ? "text-yellow-300" : "text-yellow-700"
              }`}>
                {tip.tip}
              </p>
            </div>
            {tip.explanation && (
              <p className={`max-sm:text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {tip.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Details = ({ feedback }) => {
  if (!feedback) return null;

  return (
    <div className="flex flex-col gap-4 w-full">
      <Accordion>
        {feedback.toneAndStyle && (
          <AccordionItem id="tone-style">
            <AccordionHeader itemId="tone-style">
              <CategoryHeader
                title="Tone & Style"
                categoryScore={feedback.toneAndStyle.score || 0}
              />
            </AccordionHeader>
            <AccordionContent itemId="tone-style">
              <CategoryContent tips={feedback.toneAndStyle.tips || []} />
            </AccordionContent>
          </AccordionItem>
        )}
        {feedback.content && (
          <AccordionItem id="content">
            <AccordionHeader itemId="content">
              <CategoryHeader title="Content" categoryScore={feedback.content.score || 0} />
            </AccordionHeader>
            <AccordionContent itemId="content">
              <CategoryContent tips={feedback.content.tips || []} />
            </AccordionContent>
          </AccordionItem>
        )}
        {feedback.structure && (
          <AccordionItem id="structure">
            <AccordionHeader itemId="structure">
              <CategoryHeader
                title="Structure"
                categoryScore={feedback.structure.score || 0}
              />
            </AccordionHeader>
            <AccordionContent itemId="structure">
              <CategoryContent tips={feedback.structure.tips || []} />
            </AccordionContent>
          </AccordionItem>
        )}
        {feedback.skills && (
          <AccordionItem id="skills">
            <AccordionHeader itemId="skills">
              <CategoryHeader title="Skills" categoryScore={feedback.skills.score || 0} />
            </AccordionHeader>
            <AccordionContent itemId="skills">
              <CategoryContent tips={feedback.skills.tips || []} />
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};

export default Details;

