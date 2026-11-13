Método · versión 1.3

# Cómo se calcula cada cosa

El Explorador hace lecturas distantes de una sola obra: cuenta dónde aparecen las palabras y cuáles coinciden. Esta página explica cada cálculo para que puedas citar la herramienta con honestidad y saber qué puede y qué no puede sostener un hallazgo. Las cifras son las que usa el programa.

## 1. Del PDF al texto

El PDF se lee página por página y se aplican reglas generales, en este orden:

- **Cabeceras y pies repetidos**: una línea que aparece en al menos el 20 % de las páginas (y en 4 o más) se quita, salvo que sea un título de capítulo. Los dígitos se ignoran al comparar, así que «La metamorfosis 23» y «La metamorfosis 24» cuentan como la misma línea.

- **Números de página**: una línea que es solo un número (también «~ 12 ~» o «— 12 —») se quita si sigue la paginación del libro, es decir, si su valor coincide con el de las hojas vecinas (±8 hojas). Los números que no la siguen se conservan, porque pueden ser títulos de capítulo («1», «2», «3»).

- **Índice**: líneas con puntos guía (`II ........ 9`). **Adornos**: líneas con un solo carácter. **Notas al pie**: últimas líneas de una página que empiezan con un número o un asterisco seguido de mayúscula.

- **Notas editoriales y colofón**: URL, ©, ISBN, «se terminó de imprimir»… Si aparecen en el último 8 % de la obra, se corta desde ahí.

- **Palabras partidas**: una línea que termina en letra + guion se une con la siguiente si esta empieza en minúscula (salvo que el guion cierre un inciso).

- **Estructura**: se buscan títulos («CAPÍTULO 3», «Capítulo primero», «III», «3», «Acto I / Escena II», «Parte», «Canto»…) y se elige la secuencia 1, 2, 3… más larga, tolerando hasta dos títulos faltantes. Así el índice o un número suelto no se confunden con capítulos. Si no hay números, se prueban títulos en mayúsculas al comienzo de página (al menos tres, separados por unas 25 líneas o más). Si tampoco hay, la obra se divide en bloques de unas 2 500 palabras (500 en modo cuento). Todo lo anterior al primer capítulo se descarta (portada, prólogo, dedicatoria) y se informa.

## 2. Páginas y voces

Cada frase conserva su página. Si el PDF trae la numeración impresa al pie o en la cabecera de forma regular (en al menos el 30 % de las páginas, con un desfase constante en el 60 % de ellas), se cita por **página impresa**; si no, por **página del PDF**, y la cita lo dice.
En narrativa, un párrafo que empieza con raya o guion seguido de mayúscula es diálogo; las acotaciones entre rayas («—dijo el zorro—») vuelven a la narración. También cuentan como diálogo los textos entre comillas latinas («») y los párrafos que abren con comillas. En teatro, cada línea del tipo `HAMLET.-` abre un parlamento; las acotaciones se excluyen del análisis.

## 3. Palabras y unidades

Las palabras se pasan a minúsculas y sin tildes, protegiendo la ñ (*niño* no se confunde con *nino*). Las conexiones se cuentan dentro de una **unidad**: la **oración** en narrativa (se corta tras . ! ? …), el **parlamento** en teatro, o, para comparar, el **párrafo** y una **ventana** de 60 palabras seguidas.

## 4. Candidatos a motivos

Se descartan las palabras gramaticales, unas cuarenta formas verbales muy frecuentes con su conjugación (*ser, estar, tener, decir, ir*…) y palabras genéricas (*cosa, vez, modo, señor*). El singular y el plural se unen (*estrella, estrellas*; *flor, flores*; *luz, luces*). Entra como candidata toda palabra con al menos 4 apariciones (o una por cada 15 000 palabras en obras largas). Se ordenan en tres listas:

- **Recorren toda la obra**: aparecen en 8 o más de sus 10 décimas partes; se ordenan por frecuencia.

- **Aparecen en ráfagas**: el 45 % o más de sus apariciones cae en una sola décima parte.

- **Nombres**: palabras escritas con mayúscula en el 85 % o más de los casos en que no empiezan oración.

El cuaderno de Colab añade una cuarta lista, las palabras **propias de esta obra** frente al español general, que requiere la librería *wordfreq*.

## 5. Conexiones

Para dos motivos A y B, *n_A* y *n_B* son las unidades donde aparece cada uno, *c* las unidades donde aparecen juntos y *N* el total de unidades.
fuerza = c ÷ √(n_A × n_B)
veces lo esperado (lift) = c × N ÷ (n_A × n_B)
La fuerza vale 1 si siempre aparecen juntos y 0 si nunca; evita que los motivos muy frecuentes se unan con todo. El *lift* compara lo observado con lo que daría el azar: 3 significa «tres veces más de lo esperado». Una conexión se muestra si *c* llega a un mínimo (2 en obras de menos de 5 000 unidades; en las más largas, una por cada 3 000 unidades y nunca menos de 3; dentro de un tramo, 2) y si su lift es mayor que 1. Se dibujan las 40 más fuertes.

## 6. Palabras de las uniones

| La lectura dice | Condición |
|---|---|

| inseparables | lift ≥ 5 y al menos 5 unidades juntas |
|---|---|

| muy unidos | lift ≥ 3 y al menos 3 unidades juntas |
|---|---|

| unidos | lift ≥ 1,8 |
|---|---|

| cercanos | el resto de las conexiones mostradas (lift > 1) |
|---|---|

## 7. Solidez

Cada conexión de la obra completa se recalcula con las tres unidades (oración, párrafo o parlamento y ventana). Es **sólida** si queda entre las más fuertes con las tres, **probable** con dos y **frágil** con una; las frágiles se dibujan punteadas. Una conexión frágil depende de cómo se mida: no la sostengas sin leer sus frases.

## 8. Familias, puente y disposición

Los colores agrupan motivos en **familias** que se conectan más entre sí que con el resto, mediante la fase local del método de Louvain (Blondel et al., 2008), con la fuerza como peso. El **puente** es el motivo con mayor intermediación (Brandes, 2001): por él pasan más caminos cortos entre otros motivos, con distancia = 1 ÷ fuerza; se informa si supera 0,05. La posición de cada motivo se calcula con un modelo de resortes (Fruchterman y Reingold, 1991) sobre la obra completa y se mantiene en cada tramo para comparar.

## 9. Hallazgos

Solo se consideran motivos con al menos 5 apariciones (o una por cada 20 000 palabras).

- **El puente**: mayor intermediación (> 0,05).

- **Pareja constante**: conexión sólida (3 de 3), con 3 o más unidades juntas y el mayor lift.

- **Nace tarde**: primera aparición después del 30 % de la obra (la más tardía). **Se apaga**: última aparición antes del 70 % (la más temprana).

- **En ráfaga**: el 60 % o más de sus apariciones en un tramo que no ocupa más del 45 % de la obra.

- **Un encuentro**: una conexión con 4 o más unidades juntas y el 60 % o más de ellas en un mismo tramo.

- **Se evitan**: dos motivos con 10 o más unidades cada uno que coinciden en un 35 % o menos de lo esperado (con al menos 4 coincidencias esperadas).

## 10. Personajes

**Reparto.** Si la obra tiene perfil, se usa su reparto. Si no, se propone uno: entran como nombres las palabras que van con mayúscula en el 85 % o más de los casos en que no empiezan oración, y se juntan las que aparecen seguidas («Rosendo Maqui», «Fernanda del Carpio»). Una forma corta se une a la larga que la contiene (*Rosendo* → *Rosendo Maqui*), salvo que ambas aparezcan en una misma oración, señal de que son personas distintas. Si la forma corta cabe en varias largas, queda como nombre compartido; si suele ir con «los» («los Buendía»), es un apellido de familia y no un personaje. Un nombre de una sola palabra que va precedido de *a, de, del, en, hacia, desde, hasta* en el 45 % o más de los casos, casi nunca empieza oración, no va junto a verbos de habla y rara vez va seguido de un verbo se trata como lugar (*en Rumi*, *de Macondo*). En teatro, los hablantes entran siempre. Se proponen hasta 25 personajes.

**Menciones.** Se busca cada forma del reparto en el texto y gana la más larga («José Arcadio Buendía» no cuenta como «José Arcadio»). Una forma que es nombre propio solo cuenta con mayúscula («Rosa» sí, «rosa» no). Una forma con rango (`aureliano [15-20]`) solo cuenta en esos capítulos. Una mención que sirve para varios personajes se asigna, dentro del mismo capítulo, al personaje nombrado sin ambigüedad más cerca (se prefiere el anterior: la distancia hacia atrás pesa 1 y hacia adelante 1,5); si no hay ninguno, no se cuenta.

**Red y roles.** La unidad es el **pasaje**: párrafos (o parlamentos) seguidos hasta sumar unas 120 palabras, sin cruzar de capítulo. Dos personajes se unen si coinciden en 2 o más pasajes (3 en obras de más de 3 000 pasajes); se muestran las 80 uniones más frecuentes. Las palabras de la unión dependen de qué parte de los pasajes del menos frecuente comparten: la mitad o más, «casi siempre juntos»; un cuarto, «a menudo»; menos, «a veces». El peso de un personaje mezcla por igual sus menciones (más sus parlamentos) y sus pasajes compartidos. Es **protagonista** si su peso llega al 70 % del mayor y aparece en el 60 % de los tramos (como máximo tres); **principal** con 30 % y 40 %; **episódico** si el 70 % de sus menciones cae en un tramo o si todas caben en una cuarta parte de la obra; el resto, **secundario**. Es **puente** si su intermediación supera 0,15. Los círculos de color y la disposición usan los mismos métodos que la red de motivos.

**Cómo lo llama la obra.** Se recogen las palabras en minúscula pegadas al nombre («el coronel Aureliano», «el viejo Rosendo») y las aposiciones entre comas («Nasha Suro, la curandera,»). Una fórmula entra si se repite al menos tres veces y si, en la obra, suele ir pegada a un nombre (así se descartan «al principio» o «en el cuarto»).

**Motivos que lo acompañan.** Para cada motivo se compara la parte de los pasajes del personaje en que aparece con la parte de todos los pasajes; se muestran los que aparecen al menos 3 veces y 1,3 veces más de lo esperado.

## 11. Árbol de familia

Los vínculos vienen del perfil o de lo que escribas (`Nombre: hijo de A y B; esposa de C`). Si no hay ninguno, se proponen a partir de frases del tipo «X, hijo de Y», «Y y su hija X» o «X, su esposa». Hijos y padres ordenan las generaciones (cada hijo, al menos una fila debajo de sus padres); las parejas van lado a lado, y cuando pertenecen a generaciones distintas se unen con una curva.

Para cada vínculo se busca una frase que lo respalde: una oración que nombre a los dos personajes, con una palabra de parentesco (*hijo, madre, esposa, se casaron, amante*…) a no más de 4 palabras de uno de ellos y los dos nombres a no más de 25 palabras entre sí. Se muestran hasta tres frases. Si no hay ninguna, el vínculo se dibuja punteado: no es que sea falso, sino que el texto no lo dice en una sola frase.

## 12. Conversar con la obra

La pestaña **Conversar** es un compañero de lectura para quien ya leyó la obra. Usa Claude, el modelo de lenguaje de Anthropic, a través de la página publicada: la primera vez la página pide permiso y cada pregunta se descuenta del uso de la cuenta de Claude de quien la hace. En el archivo descargado no está disponible.

**Qué se envía.** Nunca la obra completa. Con cada pregunta se arma un paquete con tres partes: una ficha de la obra (título, capítulos, tramos, personajes con su rol, vínculos de familia y motivos), unas 20 a 24 frases elegidas para esa pregunta y las últimas ocho intervenciones de la conversación. Las frases van numeradas con su número de frase, su capítulo y su página.

**Cómo se eligen las frases.** Cada frase recibe puntos por las palabras de la pregunta que contiene, con más peso para las palabras raras en la obra (las que están en más del 20 % de las frases no cuentan); +2,5 por cada personaje de la pregunta que la frase menciona (con las mismas reglas de menciones de la sección 10) y +1,2 por cada motivo de la pregunta. Si la pregunta nombra un capítulo («en el capítulo 7»), solo se buscan frases de ese capítulo, y el selector *Alcance* limita la búsqueda a un tramo. Del total, el 60 % son las frases con más puntos y el resto se reparte a lo largo de la obra para no quedarse en un solo pasaje. Cuando la página lo permite, el modelo puede pedir una búsqueda más (hasta 12 frases) si las que recibió no bastan.

**Reglas que recibe el modelo.** Responder solo con lo que dicen las frases enviadas y citarlas con su número, como [123]; si las frases no bastan, decirlo en vez de completar de memoria; separar lo que dice el texto de la interpretación, que empieza con «Una lectura posible:»; no pasar de unas 170 palabras; y ayudar a pensar más que dar conclusiones cerradas. Hay tres modos: *Preguntar a la obra* (responde citando), *Ponme a prueba* (hace preguntas de comprensión y corrige con la frase que las resuelve) y *Socrático* (responde con preguntas que llevan de vuelta al texto).

**Cómo se comprueba.** Cada número citado se convierte en un botón que lleva a la frase. Debajo de cada respuesta están las frases citadas con su capítulo y página, listas para **＋ citar** o para guardar toda la respuesta en el Cuaderno. Si el modelo cita un número que no se le envió, aparece tachado en rojo y con un aviso: esa afirmación no está respaldada.

**Límites.** Cada pregunta tiene un costo de uso. El modelo solo ve fragmentos: puede perder lo que está en frases que no se eligieron, y la selección depende de las palabras de la pregunta (los pronombres y apodos fuera del reparto no ayudan). Sus respuestas son hipótesis de lectura que se comprueban en el texto, no una autoridad sobre la obra.

## 13. Lo que no mide

- **Sentido.** Dos motivos unidos pueden coincidir por afinidad, por contraste o por casualidad. La red mide vecindad.

- **Negación e ironía.** «No había rosas» cuenta como *rosa*.

- **Imágenes sin palabra.** Una fuente que nunca se nombra no existe para el programa.

- **Sinónimos no declarados.** Si no agrupas *mirar, ver, ojos*, son motivos distintos.

- **Pronombres y apodos.** «Él», «ella» o un apodo que no está en el reparto no cuentan como mención: un personaje muy presente pero poco nombrado parece pequeño.

- **Respuestas del compañero de lectura.** Conversar no mide nada: propone lecturas a partir de frases elegidas. Lo que dice vale lo que valen sus citas.

- **Traducciones.** El análisis es de la edición que subiste, no del original.

- **Dependencia de las decisiones.** El diccionario de motivos, la unidad y los tramos cambian el resultado. Cámbialos y comprueba qué resiste.

## Referencias

- Blondel, V. D., Guillaume, J.-L., Lambiotte, R. y Lefebvre, E. (2008). Fast unfolding of communities in large networks. *Journal of Statistical Mechanics*, P10008.

- Brandes, U. (2001). A faster algorithm for betweenness centrality. *Journal of Mathematical Sociology*, 25(2), 163–177.

- Church, K. W. y Hanks, P. (1990). Word association norms, mutual information, and lexicography. *Computational Linguistics*, 16(1), 22–29.

- Elson, D. K., Dames, N. y McKeown, K. R. (2010). Extracting social networks from literary fiction. En *Proceedings of the 48th Annual Meeting of the Association for Computational Linguistics* (pp. 138–147). Association for Computational Linguistics.
- Fruchterman, T. M. J. y Reingold, E. M. (1991). Graph drawing by force-directed placement. *Software: Practice and Experience*, 21(11), 1129–1164.

- Jockers, M. L. (2013). *Macroanalysis: Digital Methods and Literary History*. University of Illinois Press.

- Moretti, F. (2011). Network Theory, Plot Analysis. *Stanford Literary Lab Pamphlets*, 2.

- Moretti, F. (2013). *Distant Reading*. Verso.
