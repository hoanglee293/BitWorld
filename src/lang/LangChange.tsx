"use client";
import { useLang, useBrowserLanguage, useBrowserLanguageInfo } from "./useLang";
import { langConfig } from "./index";

export const LangChange = () => {
  const { lang, setLang, langConfig: config } = useLang();
  const { browserLang, isDetecting } = useBrowserLanguage();
  const languageInfo = useBrowserLanguageInfo();

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      <div className="flex flex-wrap gap-2">
        {config.listLangs.map((langItem) => (
          <button
            key={langItem.code}
            onClick={() => setLang(langItem.code)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors ${
              lang === langItem.code
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <img
              src={langItem.flag}
              alt={langItem.name}
              className="w-5 h-3 object-cover rounded"
            />
            <span>{langItem.name}</span>
          </button>
        ))}
      </div>

      {/* Browser language detection information */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <h3 className="font-semibold text-sm text-gray-700 mb-2">
          Browser Language Information:
        </h3>
        
        {isDetecting ? (
          <p className="text-sm text-gray-500">Detecting language...</p>
        ) : (
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Current language:</span> {lang}
            </p>
            <p>
              <span className="font-medium">Browser language:</span> {browserLang}
            </p>
            {languageInfo && (
              <>
                <p>
                  <span className="font-medium">Language code:</span> {languageInfo.language}
                </p>
                <p>
                  <span className="font-medium">Language list:</span> {languageInfo.languages.join(', ')}
                </p>
              </>
            )}
            {browserLang !== lang && (
              <p className="text-orange-600 text-xs">
                💡 Browser language differs from current language
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
