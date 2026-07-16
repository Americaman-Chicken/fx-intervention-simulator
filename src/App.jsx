import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calculator,
  Info,
  Plus,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

const CURRENCY_PAIRS = [
  "USD/JPY",
  "EUR/JPY",
  "GBP/JPY",
  "AUD/JPY",
  "NZD/JPY",
  "CHF/JPY",
  "CAD/JPY",
  "TRY/JPY",
  "HUF/JPY",
  "CZK/JPY",
  "MXN/JPY",
  "ZAR/JPY",
];

const MAX_LEVERAGE = 25;
const MAX_DROP_RATE = 10;

const initialPosition = {
  id: crypto.randomUUID(),
  pair: "USD/JPY",
  side: "long",
  price: "155",
  quantity: "10000",
  swap: "120",
};

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function clamp(number, min, max) {
  return Math.min(Math.max(number, min), max);
}

function formatYen(value, options = {}) {
  if (!Number.isFinite(value)) return "--";
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
  }).format(value);
}

function formatNumber(value, digits = 1) {
  if (!Number.isFinite(value)) return "--";
  return new Intl.NumberFormat("ja-JP", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function getSeverity(rate) {
  if (rate < 1) return { color: "text-emerald-300", bar: "bg-emerald-400" };
  if (rate < 3) return { color: "text-amber-300", bar: "bg-amber-400" };
  if (rate < 5) return { color: "text-orange-300", bar: "bg-orange-400" };
  return { color: "text-red-300", bar: "bg-red-400" };
}

function ResultMetric({ label, value, tone = "neutral", help }) {
  const tones = {
    neutral: "text-slate-100",
    profit: "text-red-300",
    loss: "text-sky-300",
    safe: "text-emerald-300",
    warn: "text-amber-300",
    danger: "text-red-300",
  };

  return (
    <div className="rounded-lg border border-slate-700/80 bg-slate-950/60 p-4">
      <p className="text-xs text-slate-300">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${tones[tone]}`}>{value}</p>
      {help ? <p className="mt-2 text-xs leading-5 text-amber-100">{help}</p> : null}
    </div>
  );
}

function PositionCard({ position, index, canDelete, onChange, onDelete }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-300">ポジション {index + 1}</p>
          <p className="text-sm font-semibold text-slate-100">{position.pair}</p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete}
          aria-label={`ポジション ${index + 1} を削除`}
          title="削除"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 text-slate-300 transition hover:border-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="text-slate-300">通貨ペア</span>
          <select
            value={position.pair}
            onChange={(event) => onChange("pair", event.target.value)}
            className="h-11 rounded-md border border-slate-700 bg-slate-900 px-3 text-slate-100 outline-none focus:border-amber-400"
          >
            {CURRENCY_PAIRS.map((pair) => (
              <option key={pair} value={pair}>
                {pair}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="grid gap-1 text-sm">
          <legend className="text-slate-300">売買方向</legend>
          <div className="grid h-11 grid-cols-2 rounded-md border border-slate-700 bg-slate-900 p-1">
            {[
              ["long", "ロング"],
              ["short", "ショート"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange("side", value)}
                className={`rounded px-2 text-sm transition ${
                  position.side === value
                    ? "bg-amber-400 text-slate-950"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-300">現在価格</span>
          <input
            value={position.price}
            onChange={(event) => onChange("price", event.target.value)}
            type="number"
            min="0"
            step="0.001"
            inputMode="decimal"
            className="h-11 rounded-md border border-slate-700 bg-slate-900 px-3 text-slate-100 outline-none focus:border-amber-400"
            placeholder="155.000"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-300">保有数量</span>
          <input
            value={position.quantity}
            onChange={(event) => onChange("quantity", event.target.value)}
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            className="h-11 rounded-md border border-slate-700 bg-slate-900 px-3 text-slate-100 outline-none focus:border-amber-400"
            placeholder="10000"
          />
        </label>

        <label className="grid gap-1 text-sm sm:col-span-2">
          <span className="text-slate-300">1万通貨あたりの1日分スワップ</span>
          <input
            value={position.swap}
            onChange={(event) => onChange("swap", event.target.value)}
            type="number"
            step="1"
            inputMode="decimal"
            className="h-11 rounded-md border border-slate-700 bg-slate-900 px-3 text-slate-100 outline-none focus:border-amber-400"
            placeholder="マイナススワップは -80 のように入力"
          />
        </label>
      </div>
    </div>
  );
}

export default function FxInterventionSimulator() {
  const [dropRateInput, setDropRateInput] = useState("2");
  const [depositInput, setDepositInput] = useState("1000000");
  const [positions, setPositions] = useState([initialPosition]);
  const [hasCalculated, setHasCalculated] = useState(false);

  const dropRate = clamp(toFiniteNumber(dropRateInput), 0, MAX_DROP_RATE);
  const deposit = Math.max(toFiniteNumber(depositInput), 0);
  const severity = getSeverity(dropRate);

  const simulation = useMemo(() => {
    const rows = positions.map((position) => {
      const price = Math.max(toFiniteNumber(position.price), 0);
      const quantity = Math.max(toFiniteNumber(position.quantity), 0);
      const swap = toFiniteNumber(position.swap);
      const afterPrice = price * (1 - dropRate / 100);
      const profitLoss =
        position.side === "long"
          ? (afterPrice - price) * quantity
          : (price - afterPrice) * quantity;
      const dailySwap = (quantity / 10000) * swap;
      const notional = price * quantity;
      const valid = price > 0 && quantity > 0;

      return {
        ...position,
        price,
        quantity,
        swap,
        afterPrice,
        profitLoss: valid ? profitLoss : 0,
        dailySwap: valid ? dailySwap : 0,
        notional: valid ? notional : 0,
        valid,
      };
    });

    const totalProfitLoss = rows.reduce((sum, row) => sum + row.profitLoss, 0);
    const totalDailySwap = rows.reduce((sum, row) => sum + row.dailySwap, 0);
    const totalNotional = rows.reduce((sum, row) => sum + row.notional, 0);
    const requiredMargin = totalNotional / MAX_LEVERAGE;
    const effectiveLeverage = deposit > 0 ? totalNotional / deposit : null;
    const marginRatio = requiredMargin > 0 && deposit > 0 ? (deposit / requiredMargin) * 100 : null;
    const afterMarginRatio =
      requiredMargin > 0 && deposit > 0
        ? ((deposit + totalProfitLoss) / requiredMargin) * 100
        : null;

    let swapDays = null;
    let swapMessage = "スワップが0円のため日数換算はできません。";
    if (totalDailySwap > 0 && totalProfitLoss < 0) {
      swapDays = Math.abs(totalProfitLoss) / totalDailySwap;
      swapMessage = "評価損失を取り戻すために必要なスワップ日数の概算です。";
    } else if (totalDailySwap > 0 && totalProfitLoss > 0) {
      swapDays = totalProfitLoss / totalDailySwap;
      swapMessage = "評価利益に相当するスワップ日数の概算です。";
    } else if (totalDailySwap < 0) {
      swapMessage = "合計スワップがマイナスのため、1日あたりの追加コストとして扱います。";
    }

    return {
      rows,
      totalProfitLoss,
      totalDailySwap,
      totalNotional,
      requiredMargin,
      effectiveLeverage,
      marginRatio,
      afterMarginRatio,
      swapDays,
      swapMessage,
      invalidCount: rows.filter((row) => !row.valid).length,
    };
  }, [dropRate, positions, deposit]);

  const riskTone =
    simulation.afterMarginRatio === null
      ? "neutral"
      : simulation.afterMarginRatio < 100
        ? "danger"
        : simulation.afterMarginRatio < 200
          ? "warn"
          : "safe";
  const riskLabel =
    simulation.afterMarginRatio === null
      ? "入金額を入力してください"
      : simulation.afterMarginRatio < 100
        ? "危険（概算ロスカット水準）"
        : simulation.afterMarginRatio < 200
          ? "注意"
          : "安全圏の目安";

  const updatePosition = (id, key, value) => {
    setPositions((current) =>
      current.map((position) => (position.id === id ? { ...position, [key]: value } : position)),
    );
  };

  const addPosition = () => {
    setPositions((current) => [
      ...current,
      {
        ...initialPosition,
        id: crypto.randomUUID(),
        price: "",
        quantity: "",
        swap: "0",
      },
    ]);
  };

  const removePosition = (id) => {
    setPositions((current) => current.filter((position) => position.id !== id));
  };

  const handleRateInput = (value) => {
    setDropRateInput(value);
  };

  const handleRateBlur = () => {
    setDropRateInput(String(clamp(toFiniteNumber(dropRateInput), 0, MAX_DROP_RATE)));
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="h-3 bg-[repeating-linear-gradient(135deg,#f59e0b_0,#f59e0b_14px,#111827_14px,#111827_28px)]" />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-sm text-amber-200">
            <AlertTriangle size={16} />
            クロス円FXの概算シミュレーター
          </div>
          <h1 className="text-3xl font-bold tracking-normal text-white sm:text-4xl">
            為替介入シミュレーター
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            FXのクロス円ポジションについて、円買い介入などで為替レートが下落した場合の評価損益、スワップ換算日数、
            実効レバレッジ、証拠金維持率を概算します。結果は投資判断を保証するものではありません。
          </p>
        </header>

        <section className="mb-6 rounded-lg border border-slate-700 bg-slate-900/80 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-300">想定下落率</p>
              <p className={`mt-1 text-2xl font-bold ${severity.color}`}>
                {formatNumber(dropRate, 1)}%
              </p>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800 md:max-w-sm">
              <div className={`h-full ${severity.bar}`} style={{ width: `${(dropRate / MAX_DROP_RATE) * 100}%` }} />
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
          <section className="space-y-5">
            <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-5">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <TrendingDown size={20} className="text-amber-300" />
                シナリオ入力
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm sm:col-span-2">
                  <span className="text-slate-300">想定下落率（0〜10%）</span>
                  <input
                    value={dropRate}
                    onChange={(event) => handleRateInput(event.target.value)}
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    className="accent-amber-400"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  <span className="text-slate-300">下落率（%）</span>
                  <input
                    value={dropRateInput}
                    onChange={(event) => handleRateInput(event.target.value)}
                    onBlur={handleRateBlur}
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    inputMode="decimal"
                    className="h-11 rounded-md border border-slate-700 bg-slate-950 px-3 text-slate-100 outline-none focus:border-amber-400"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  <span className="text-slate-300">入金額（円）</span>
                  <input
                    value={depositInput}
                    onChange={(event) => setDepositInput(event.target.value)}
                    type="number"
                    min="0"
                    step="10000"
                    inputMode="decimal"
                    className="h-11 rounded-md border border-slate-700 bg-slate-950 px-3 text-slate-100 outline-none focus:border-amber-400"
                    placeholder="1000000"
                  />
                </label>
              </div>

              {toFiniteNumber(dropRateInput) !== dropRate ? (
                <p className="mt-3 text-xs text-amber-200">
                  下落率は計算時に0〜10%の範囲へ調整されます。
                </p>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">ポジション入力</h2>
                <button
                  type="button"
                  onClick={addPosition}
                  className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
                >
                  <Plus size={16} />
                  追加
                </button>
              </div>

              {positions.map((position, index) => (
                <PositionCard
                  key={position.id}
                  position={position}
                  index={index}
                  canDelete={positions.length > 1}
                  onChange={(key, value) => updatePosition(position.id, key, value)}
                  onDelete={() => removePosition(position.id)}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setHasCalculated(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-orange-400"
            >
              <Calculator size={18} />
              計算する
            </button>
          </section>

          <section className="space-y-5">
            <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-5">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <TrendingUp size={20} className="text-amber-300" />
                シミュレーション結果
              </h2>

              {!hasCalculated ? (
                  <div className="rounded-lg border border-dashed border-slate-600 p-6 text-sm leading-7 text-slate-200">
                  条件を入力して「計算する」を押すと、概算結果を表示します。
                </div>
              ) : (
                <div className="grid gap-3">
                  {simulation.invalidCount > 0 ? (
                    <div className="flex gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-100">
                      <Info size={18} className="mt-0.5 shrink-0" />
                      価格または数量が0以下のポジションは、合計計算から除外しています。
                    </div>
                  ) : null}

                  <ResultMetric
                    label="合計評価損益"
                    value={`${simulation.totalProfitLoss >= 0 ? "利益 " : "損失 "}${formatYen(Math.abs(simulation.totalProfitLoss))}`}
                    tone={simulation.totalProfitLoss >= 0 ? "profit" : "loss"}
                    help="日本の金融画面で見かける配色に合わせ、利益は赤、損失は青で表示しています。"
                  />
                  <ResultMetric label="ポジション総額" value={formatYen(simulation.totalNotional)} />
                  <ResultMetric label="必要証拠金の概算" value={formatYen(simulation.requiredMargin)} />
                  <ResultMetric
                    label="実効レバレッジ"
                    value={
                      simulation.effectiveLeverage === null
                        ? "--"
                        : `${formatNumber(simulation.effectiveLeverage, 2)} 倍`
                    }
                  />
                  <ResultMetric
                    label="介入後の参考証拠金維持率"
                    value={
                      simulation.afterMarginRatio === null
                        ? "--"
                        : `${formatNumber(simulation.afterMarginRatio, 1)}%`
                    }
                    tone={riskTone}
                    help={riskLabel}
                  />
                  <ResultMetric
                    label="1日あたりの合計スワップ"
                    value={formatYen(simulation.totalDailySwap)}
                    tone={simulation.totalDailySwap < 0 ? "loss" : "neutral"}
                  />
                  <ResultMetric
                    label="スワップ換算"
                    value={simulation.swapDays === null ? "--" : `約 ${formatNumber(simulation.swapDays, 1)} 日分`}
                    help={simulation.swapMessage}
                  />
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-5">
              <h2 className="mb-4 text-lg font-semibold">ポジション別の概算</h2>
              <div className="space-y-3">
                {simulation.rows.map((row, index) => (
                  <div key={row.id} className="rounded-lg border border-slate-700 bg-slate-950/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">
                        {index + 1}. {row.pair} / {row.side === "long" ? "ロング" : "ショート"}
                      </p>
                      <p className={row.profitLoss >= 0 ? "text-red-300" : "text-sky-300"}>
                        {row.profitLoss >= 0 ? "利益" : "損失"} {formatYen(Math.abs(row.profitLoss))}
                      </p>
                    </div>
                    <dl className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                      <div>
                        <dt>介入後予想価格</dt>
                        <dd className="text-slate-200">{formatNumber(row.afterPrice, 3)}</dd>
                      </div>
                      <div>
                        <dt>1日分スワップ</dt>
                        <dd className="text-slate-200">{formatYen(row.dailySwap)}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-slate-600 bg-slate-900/60 p-5 text-center text-sm text-slate-300">
              広告スペース（Ad placeholder）
            </div>
          </section>
        </div>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-5">
            <h2 className="mb-3 text-lg font-semibold text-white">使い方</h2>
            <ol className="space-y-2 text-sm leading-7 text-slate-200">
              <li>1. 入金額を入力します。</li>
              <li>2. 保有している通貨ペアを選びます。</li>
              <li>3. ロングまたはショートを選び、現在価格と保有数量を入力します。</li>
              <li>4. 1万通貨あたりの1日分スワップを入力します。</li>
              <li>5. 想定下落率を動かして「計算する」を押すと、損益や証拠金維持率の概算を確認できます。</li>
            </ol>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-5">
            <h2 className="mb-3 text-lg font-semibold text-white">計算方法</h2>
            <div className="space-y-3 text-sm leading-7 text-slate-200">
              <p>介入後価格は「現在価格 ×（1 - 想定下落率 ÷ 100）」で概算します。</p>
              <p>ロングは下落すると評価損、ショートは下落すると評価益として計算します。</p>
              <p>必要証拠金は国内個人FXの最大レバレッジ25倍を前提に「ポジション総額 ÷ 25」で概算します。</p>
              <p>証拠金維持率は「入金額 ÷ 必要証拠金 × 100」を基本に、介入後の評価損益を反映した参考値も表示します。</p>
              <p>スワップ換算日数は、評価損益が1日分の合計スワップの何日分に相当するかを示す目安です。</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-slate-700 bg-slate-900/80 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck size={20} className="text-emerald-300" />
            免責事項
          </h2>
          <p className="text-sm leading-7 text-slate-300">
            本ツールは概算シミュレーションであり、実際の相場変動、約定価格、スプレッド、
            スリッページ、税金、手数料、スワップポイント、ロスカットルールを保証するものではありません。
            為替介入時には流動性が低下する可能性があります。投資判断はご自身の責任で行ってください。
          </p>
        </section>

        <section id="privacy-policy" className="mt-8 rounded-lg border border-slate-700 bg-slate-900/80 p-5">
          <h2 className="mb-3 text-lg font-semibold text-white">プライバシーポリシー</h2>
          <div className="space-y-4 text-sm leading-7 text-slate-200">
            <p>
              当サイト「為替介入シミュレーター」は、FXポジションの損益や証拠金維持率を概算するための情報提供ツールです。
              現時点では、ユーザー登録、ログイン、決済、入力データのサーバー保存は行っていません。
            </p>

            <div>
              <h3 className="font-semibold text-amber-100">取得する情報について</h3>
              <p>
                当サイトでは、ユーザーが入力した入金額、通貨ペア、価格、数量、スワップポイントなどの情報を、
                ブラウザ上の計算処理にのみ使用します。これらの入力内容はサーバーへ保存されません。
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-amber-100">アクセス解析・広告配信について</h3>
              <p>
                今後、サイト改善や広告収益化のために、Google AdSense、Google Analyticsなどの第三者サービスを利用する場合があります。
                その際、Cookieを使用してユーザーの閲覧情報が取得されることがあります。
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-amber-100">Cookieについて</h3>
              <p>
                Googleなどの第三者配信事業者は、Cookieを使用して、ユーザーが当サイトや他のサイトに過去にアクセスした情報に基づき、
                広告を配信する場合があります。ユーザーはGoogleの広告設定から、パーソナライズ広告を無効にできます。
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-amber-100">お問い合わせについて</h3>
              <p>
                お問い合わせはXアカウント
                <a
                  href="https://x.com/chicken_fx_"
                  target="_blank"
                  rel="noreferrer"
                  className="mx-1 text-amber-100 underline-offset-4 hover:underline"
                >
                  @chicken_fx_
                </a>
                までお願いします。
              </p>
            </div>
          </div>
        </section>

        <section id="contact" className="mt-8 rounded-lg border border-slate-700 bg-slate-900/80 p-5">
          <h2 className="mb-3 text-lg font-semibold text-white">お問い合わせ</h2>
          <div className="space-y-3 text-sm leading-7 text-slate-200">
            <p>
              当サイトへのお問い合わせは、Xアカウント
              <a
                href="https://x.com/chicken_fx_"
                target="_blank"
                rel="noreferrer"
                className="mx-1 text-amber-100 underline-offset-4 hover:underline"
              >
                @chicken_fx_
              </a>
              までお願いします。
            </p>
            <p>
              不具合報告、表示内容の修正依頼、広告掲載に関するご連絡を受け付けています。
            </p>
            <p className="text-amber-100">
              なお、個別の投資判断、売買タイミング、特定の金融商品の推奨に関するご相談には対応できません。
            </p>
          </div>
        </section>

        <footer className="mt-8 flex flex-wrap gap-3 border-t border-slate-800 pt-5 text-xs text-slate-300">
          <a href="#privacy-policy" className="text-amber-100 underline-offset-4 hover:underline">
            プライバシーポリシー
          </a>
          <span>利用規約：準備中</span>
          <a href="#contact" className="text-amber-100 underline-offset-4 hover:underline">
            お問い合わせ
          </a>
        </footer>
      </div>
    </main>
  );
}
